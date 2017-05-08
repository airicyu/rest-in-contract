'use strict';

const { wirestub } = require('./../models/models');

const { Timer } = require('./../utils/timer-utils');
const dsl = require('./../contract-script/dsl/dsl');

const { recurrsiveToString } = dsl.utils;
const { Middleware } = dsl.baseTypes;
const { recurrsiveEvaluate, recurrsiveCompare, recurrsiveMock } = dsl.functions;

const appServices = require('./app-services');
const versionServices = require('./version-services');
const contractServices = require('./contract-services');

const querystring = require('querystring');
const request = require('request');
const expect = require('chai').expect;

async function appWiretest(appId, wiretest) {
    let error, app, version;
    [error, app] = (await appServices.get(appId)).getOrThrow();

    let records = await testApp(app, wiretest);
    return records;
}

async function appVersionWiretest(appId, versionId, wiretest) {
    let error, app, version;
    [error, app] = (await appServices.get(appId)).getOrThrow();
    [error, version] = (await versionServices.get(appId, versionId)).getOrThrow();

    let records = await testAppVersion(app, version, wiretest);
    return records;
}

async function appVersionContractWiretest(appId, versionId, contractId, wiretest) {
    let error, app, version, contract;
    [error, app] = (await appServices.get(appId)).getOrThrow();
    [error, version] = (await versionServices.get(appId, versionId)).getOrThrow();
    [error, contract] = (await contractServices.get(contractId)).getOrThrow();

    let records = await testContract(app, version, contract, wiretest);
    return records;
}



function getServerPath(app, version, wiretest) {
    let server = app.servers[0];
    if (wiretest.server) {
        server = wiretest.server;
    }

    let appBasePath = app.basePath;
    let v = version.v;
    let versionedPath = version.path;
    let basePath = appBasePath;
    if (versionedPath) {
        basePath = versionedPath.replace(/\{\{app\.basePath}}/g, appBasePath).replace(/\{\{version\.v}}/g, v);
    }

    basePath = server + basePath;
    return basePath;
}



async function testApp(app, wiretest) {
    let appTestRecords = {};
    for (let version of app.versions) {
        let appVersionTestRecords = await testAppVersion(app, version, wiretest);
        appTestRecords[version.v] = appVersionTestRecords;
    }
    return appTestRecords;
}

async function testAppVersion(app, version, wiretest) {
    let appVersionTestRecords = {};
    for (let contractId of version.contracts) {
        let [error, contract] = (await contractServices.get(contractId)).get();
        if (contract) {
            let contractId = contract.id;
            let record = await testContract(app, version, contract, wiretest);
            appVersionTestRecords[contractId] = record;
        }
    }

    return appVersionTestRecords;
}

async function testContract(app, version, contract, wiretest) {

    let timer = new Timer();

    let basePath = getServerPath(app, version, wiretest);

    let testContract = contract.toTestingContract();

    let urlPath = testContract.request.urlPath;
    urlPath = recurrsiveEvaluate(urlPath).evaluate();
    urlPath = recurrsiveMock(urlPath).mock();

    let queryParamMap = {};
    for (let queryParam of testContract.request.queryParameters) {
        let paramName = queryParam.name;
        paramName = recurrsiveEvaluate(paramName).evaluate();
        paramName = recurrsiveMock(paramName).mock();

        let paramValue = queryParam.value;
        paramValue = recurrsiveEvaluate(paramValue).evaluate();
        paramValue = recurrsiveMock(paramValue).mock();

        queryParamMap[paramName] = paramValue;
    }

    let reqHeaders = {};
    for (let headerKey in testContract.request.headers) {
        let headerValue = testContract.request.headers[headerKey];
        headerValue = recurrsiveEvaluate(headerValue).evaluate();
        headerValue = recurrsiveMock(headerValue).mock();
        reqHeaders[headerKey] = headerValue;
    }

    let reqBody = testContract.request.body;
    if (reqBody) {
        reqBody = recurrsiveEvaluate(reqBody).evaluate();
        reqBody = recurrsiveMock(reqBody).mock();
    }

    /* for recording request context */
    let requestContext = {
        method: testContract.request.method,
        urlPath: basePath + urlPath,
        queryParams: queryParamMap,
        headers: reqHeaders,
        body: reqBody
    };



    /* options for sending request */
    let requestOptions = {
        method: requestContext.method,
        uri: requestContext.urlPath,
        headers: requestContext.headers,
        qs: requestContext.queryParams
    };

    if (requestContext.headers['Content-type'] === 'application/x-www-form-urlencoded' ||
        requestContext.headers['content-type'] === 'application/x-www-form-urlencoded') {
        requestOptions['form'] = requestContext.body;
    } else if (requestContext.headers['Content-type'] && requestContext.headers['Content-type'].match(/^.*\/json.*?$/)) {
        if (typeof requestContext.body === 'object') {
            requestOptions['body'] = JSON.stringify(requestContext.body);
        }
    } else if (requestContext.body && typeof requestContext.body === 'object') {
        if (!requestContext.headers['Content-type']) {
            requestContext.headers['Content-type'] = 'application/json';
            requestOptions.headers['Content-type'] === 'application/json';
        }
        requestOptions['body'] = JSON.stringify(requestContext.body);
        //requestOptions['json'] = true;
    } else if (requestContext.body && typeof requestContext.body === 'string') {
        requestOptions['body'] = requestContext.body;
    }

    /* for evaluating values */
    let evaluateContext = {
        req: {
            method: requestContext.method,
            path: requestContext.urlPath,
            query: querystring.stringify(queryParamMap),
            body: requestContext.body,
            headers: requestContext.headers
        }
    };

    let expectResponseContext = {
        status: testContract.response.status,
        body: testContract.response.body,
        headers: testContract.response.headers,
    };
    expectResponseContext.status = recurrsiveEvaluate(expectResponseContext.status).evaluate(evaluateContext);
    expectResponseContext.body = recurrsiveEvaluate(expectResponseContext.body).evaluate(evaluateContext);

    let resHeaders = {};
    for (let headerKey in expectResponseContext.headers) {
        let headerValue = expectResponseContext.headers[headerKey]
        if (headerValue instanceof Middleware) {
            headerValue = recurrsiveEvaluate(headerValue).evaluate(evaluateContext);
        }
        resHeaders[headerKey] = headerValue;
    }
    expectResponseContext.headers = resHeaders;

    let [testRequestError, testResponse, testResponseBody] = await new Promise(function (resolve, reject) {
        request(requestOptions, function (error, response, body) {
            resolve([error, response, body]);
        });
    });


    let record = {
        testInfo: {
            timeMS: 0,
            success: false,
            errors: [],
            appId: app.id,
            version: version.v,
            contract: {
                id: contract.id,
                name: contract.name
            }
        },
        request: requestContext,
        expectedResponseScript: recurrsiveToString(testContract.response),
        response: {
            status: testResponse && testResponse.statusCode,
            headers: testResponse && testResponse.headers,
            body: testResponseBody
        }
    };

    if (testRequestError) {
        record.testInfo.errors.push(testRequestError);
        record.testInfo.timeMS = timer.stopAndGetDuration();
        return record;
    }

    /* validate response status */
    try {
        let statusCompareResult = recurrsiveCompare(expectResponseContext.status).compareFunc(testResponse.statusCode);
        expect(statusCompareResult).to.be.equals(true, 'Expect response statusCode equals expected value.');
    } catch (e) {
        console.error(e);
        record.testInfo.errors.push(e);
    }

    /* validate headers */
    for (let expectHeaderName in expectResponseContext.headers) {
        let expectHeaderNameValue = expectResponseContext.headers[expectHeaderName];
        try {
            let headerCompareResult = recurrsiveCompare(expectHeaderNameValue).compareFunc(testResponse.headers[expectHeaderName]);
            expect(headerCompareResult).to.be.equals(true, 'Expected response header equals expected value.');
        } catch (e) {
            console.error(e);
            record.testInfo.errors.push(e);
        }
    }

    /* validate body */
    try {
        let bodyCompareResult = recurrsiveCompare(expectResponseContext.body).compareFunc(testResponseBody);
        let jsonBodyCompareResult = false;
        try {
            jsonBodyCompareResult = recurrsiveCompare(expectResponseContext.body).compareFunc(JSON.parse(testResponseBody));
        } catch (e) {}
        expect(bodyCompareResult || jsonBodyCompareResult).to.be.equals(true, 'Expected response body equals expected value.');
    } catch (e) {
        console.error(e);
        record.testInfo.errors.push(e);
    }

    if (record.testInfo.errors.length === 0) {
        record.testInfo.success = true;
    }

    record.testInfo.timeMS = timer.stopAndGetDuration();
    return record;
}

Object.assign(module.exports, {
    appWiretest,
    appVersionWiretest,
    appVersionContractWiretest
});