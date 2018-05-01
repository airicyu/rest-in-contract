'use strict';
const { Result } = require('stateful-result').models;
const { wirestub } = require('./../models/models');

const { Timer } = require('./../utils/timer-utils');
const dsl = require('rest-in-contract-dsl');

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
    return Result.newSuccess({ code: 200, data: records });
}

async function appVersionWiretest(appId, versionId, wiretest) {
    let error, app, version;
    [error, app] = (await appServices.get(appId)).getOrThrow();
    [error, version] = (await versionServices.get(appId, versionId)).getOrThrow();

    let records = await testAppVersion(app, version, wiretest);
    return Result.newSuccess({ code: 200, data: records });
}

async function appVersionContractWiretest(appId, versionId, contractId, wiretest) {
    let error, app, version, contract;
    [error, app] = (await appServices.get(appId)).getOrThrow();
    [error, version] = (await versionServices.get(appId, versionId)).getOrThrow();
    [error, contract] = (await contractServices.get(contractId)).getOrThrow();

    let records = await testContract(app, version, contract, wiretest);
    return Result.newSuccess({ code: 200, data: records });
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

    let timer = new Timer();

    let appTestRecord = {
        app: {
            id: app.id,
            name: app.name
        },
        testInfo: {
            timeMS: null,
            success: false
        },
        results: []
    };
    let appTestRecords = [];
    for (let version of app.versions) {
        let appVersionTestRecords = await testAppVersion(app, version, wiretest);
        appTestRecords.push(appVersionTestRecords);
    }
    appTestRecord.results = appTestRecords;
    appTestRecord.testInfo.timeMS = timer.stopAndGetDuration();
    appTestRecord.testInfo.success = !appTestRecord.results.map(r=>r.testInfo.success).includes(false)
    return appTestRecord;
}

async function testAppVersion(app, version, wiretest) {

    let timer = new Timer();

    let appVersionTestRecord = {
        versionNo: version.v,
        testInfo: {
            timeMS: null,
            success: false
        },
        results: []
    };
    let appVersionTestRecords = [];
    for (let contractId of version.contracts) {
        let [error, contract] = (await contractServices.get(contractId)).get();
        if (contract) {
            let contractId = contract.id;
            let record = await testContract(app, version, contract, wiretest);
            appVersionTestRecords.push(record);
        }
    }

    appVersionTestRecord.results = appVersionTestRecords;
    appVersionTestRecord.testInfo.timeMS = timer.stopAndGetDuration();
    appVersionTestRecord.testInfo.success = !appVersionTestRecord.results.map(r=>r.testInfo.success).includes(false)

    return appVersionTestRecord;
}

async function testContract(app, version, contract, wiretest) {

    let timer = new Timer();

    let basePath = getServerPath(app, version, wiretest);

    let testContract = contract;

    let urlPath = testContract.request.urlPath;
    urlPath = recurrsiveEvaluate(urlPath).evaluate({ isTest: true });
    urlPath = recurrsiveMock(urlPath).mock();

    let queryParamMap = {};
    for (let queryParam of testContract.request.queryParameters) {
        let paramName = queryParam.name;
        paramName = recurrsiveEvaluate(paramName).evaluate({ isTest: true });
        paramName = recurrsiveMock(paramName).mock();

        let paramValue = queryParam.value;
        paramValue = recurrsiveEvaluate(paramValue).evaluate({ isTest: true });
        paramValue = recurrsiveMock(paramValue).mock();

        queryParamMap[paramName] = paramValue;
    }

    let reqHeaders = {};
    for (let headerKey in testContract.request.headers) {
        let headerValue = testContract.request.headers[headerKey];
        headerValue = recurrsiveEvaluate(headerValue).evaluate({ isTest: true });
        headerValue = recurrsiveMock(headerValue).mock();
        reqHeaders[headerKey] = headerValue;
    }

    let reqBody = testContract.request.body;
    if (reqBody) {
        reqBody = recurrsiveEvaluate(reqBody).evaluate({ isTest: true });
        reqBody = recurrsiveMock(reqBody).mock();
    }

    /* for recording request context */
    let testMethods = testContract.request.method;
    if (!Array.isArray(testMethods)){
        testMethods = [testMethods];
    }

    let requestResults = [];
    for(let testMethod of testMethods){
        let requestContext = {
            method: testMethod,
            urlPath: basePath + urlPath,
            queryParams: queryParamMap,
            headers: reqHeaders,
            body: reqBody
        };

        /* for evaluating values */
        let evaluateContext = {
            req: {
                method: requestContext.method,
                path: requestContext.urlPath,
                query: querystring.stringify(queryParamMap),
                body: requestContext.body,
                rawBody: '',
                jsonBody: {},
                headers: requestContext.headers
            }
        };
        if (typeof evaluateContext.req.body === 'string'){
            evaluateContext.req.rawBody = evaluateContext.req.body;
        } else {
            evaluateContext.req.rawBody = JSON.stringify(evaluateContext.req.body);
        }

        if (typeof evaluateContext.req.body === 'string'){
            try{
                evaluateContext.req.jsonBody = JSON.parse(evaluateContext.req.body);
            } catch(e){}
        } else {
            evaluateContext.req.jsonBody = evaluateContext.req.body;
        }

        let requestResult = await testContractRequest(testContract, requestContext, evaluateContext);
        requestResults.push(requestResult);
    }
    
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
            },
            expectedResponseScript: recurrsiveToString(testContract.response),
        },
        requestResults: []
    };

    record.testInfo.timeMS = timer.stopAndGetDuration();
    record.testInfo.success = !requestResults.map(r=>r.testInfo.success).includes(false);
    record.requestResults = requestResults;
    return record;
}

async function testContractRequest(testContract, requestContext, evaluateContext) {

    let timer = new Timer();

    /* options for sending request */
    let requestOptions = {
        method: requestContext.method,
        uri: requestContext.urlPath,
        headers: requestContext.headers,
        qs: requestContext.queryParams,
        resolveWithFullResponse: true
    };

    if (requestContext.headers['Content-type'] === 'application/x-www-form-urlencoded') {
        requestOptions['form'] = requestContext.body;
    } else if (requestContext.headers['Content-type'] && requestContext.headers['Content-type'].match(/^.*?\/json.*?$/)) {
        if (typeof requestContext.body === 'object') {
            requestOptions['body'] = JSON.stringify(requestContext.body);
        }
    } else if (requestContext.body && typeof requestContext.body === 'object') {
        if (!requestContext.headers['Content-type']) {
            requestContext.headers['Content-type'] = 'application/json';
        }
        requestOptions['body'] = JSON.stringify(requestContext.body);
    } else if (requestContext.body && typeof requestContext.body === 'string') {
        requestOptions['body'] = requestContext.body;
    }
    requestOptions['json'] = false;

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
        if (Middleware.isMiddleware(headerValue)) {
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
            requestMethod: requestContext.method
        },
        request: requestContext,
        response: {
            status: testResponse && testResponse.statusCode,
            headers: testResponse && testResponse.headers,
            body: testResponseBody
        }
    };

    if (testRequestError) {
        record.testInfo.errors.push(testRequestError.message);
        record.testInfo.timeMS = timer.stopAndGetDuration();
        return record;
    }

    /* validate response status */
    try {
        let statusCompareResult = recurrsiveCompare(expectResponseContext.status).compareFunc(testResponse.statusCode);
        expect(statusCompareResult).to.be.equals(true, 'Expect response statusCode equals expected value.');
    } catch (e) {
        console.error(e);
        record.testInfo.errors.push(e.message);
    }

    /* validate headers */
    for (let expectHeaderName in expectResponseContext.headers) {
        let expectHeaderNameValue = expectResponseContext.headers[expectHeaderName];
        try {
            let headerCompareResult = recurrsiveCompare(expectHeaderNameValue).compareFunc(testResponse.headers[expectHeaderName]);
            expect(headerCompareResult).to.be.equals(true, 'Expected response header equals expected value.');
        } catch (e) {
            console.error(e);
            record.testInfo.errors.push(e.message);
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
        record.testInfo.errors.push(e.message);
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