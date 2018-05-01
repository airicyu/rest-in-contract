'use strict';

const {
    wirestub
} = require('./../models/models');
const { Result } = require('stateful-result').models;
const dsl = require('rest-in-contract-dsl');
const { Middleware } = dsl.baseTypes;
const { recurrsiveEvaluate, recurrsiveCompare, recurrsiveMock, value, stubValue, testValue } = dsl.functions;

const appServices = require('./app-services');
const contractServices = require('./contract-services');

const tcpPortUsed = require('tcp-port-used');
const express = require('express');
const bodyParser = require('body-parser');
const httpShutdown = require('http-shutdown');

const stores = require('./../stores/stores');

function wirestubsStore() {
    return stores.getStore('wirestubs');
}

function stubServersStore() {
    return stores.getStore('stubServers');
}

const wirestubServices = {
    create: async (appId, wirestub) => {
        let [error, existingWirestub] = (await wirestubsStore().get(appId)).get();
        if (!existingWirestub) {
            let [error] = (await startWirestubServer(appId, wirestub)).get();
            if (!error) {
                let [error] = (await wirestubsStore().create(appId, wirestub)).get();
                return Result.newSuccess({ code: 201, message: 'Wirestub created' });
            }
        } else {
            return Result.newSuccess({ code: 200, message: 'Wirestub already running' });
        }
    },

    get: async (appId) => {
        let [error, wirestub] = (await wirestubsStore().get(appId)).get();
        if (wirestub) {
            return Result.newSuccess({ code: 200, data: wirestub });
        } else {
            return Result.newFail({ code: 404, message: 'Wirestub not found' });
        }
    },

    delete: async (appId) => {
        let [error, wirestub] = (await wirestubsStore().get(appId)).get();
        if (wirestub) {
            let [error] = (await shutdownWirestubServer(appId)).get();
            [error] = (await wirestubsStore().delete(appId)).get();
            return Result.newSuccess({ code: 204 });
        } else {
            return Result.newFail({ code: 404, message: 'Wirestub not found' });
        }
    },

    shouldContractHandle: (contract, basePath, req) => {
        let self = contract;
        let isMatch = true;

        let evaluateContext = {
            req: {
                method: req.method,
                urlPath: req.path,
                query: req.query,
                body: req.body,
                rawBody: req.rawBody,
                jsonBody: req.jsonBody,
                headers: req.headers
            },
            isStub: true
        }

        if (self.request.method) {
            if (typeof self.request.method === 'string') {
                isMatch = isMatch && req.method === self.request.method;
            } else if (Array.isArray(self.request.method)) {
                isMatch = isMatch && self.request.method.includes(req.method);
            }
        }
        if (self.request.urlPath) {
            let incomeReqPath = req.originalUrl.indexOf(basePath) === 0 ? req.path.replace(basePath, '') : req.path;
            incomeReqPath.indexOf('/') !== 0 && (incomeReqPath = '/' + incomeReqPath);
            let urlPath = self.request.urlPath;
            urlPath = recurrsiveEvaluate(urlPath).evaluate(evaluateContext);
            isMatch = isMatch && recurrsiveCompare(urlPath).compareFunc(incomeReqPath);

        }
        if (self.request.queryParameters) {
            for (let i = 0; i < self.request.queryParameters.length; i++) {
                let queryParam = self.request.queryParameters[i];
                let paramName = queryParam.name;
                paramName = recurrsiveEvaluate(paramName).evaluate(evaluateContext);

                let paramValue = queryParam.value;
                paramValue = recurrsiveEvaluate(paramValue).evaluate(evaluateContext);

                isMatch = isMatch && recurrsiveCompare(paramValue).compareFunc(req.query[paramName]);
            }
        }

        if (self.request.headers) {
            for (let headerKey in self.request.headers) {
                let headerValue = self.request.headers[headerKey];

                headerValue = recurrsiveEvaluate(headerValue).evaluate(evaluateContext);
                isMatch = isMatch && recurrsiveCompare(headerValue).compareFunc(req.headers[headerKey.toLowerCase()]);
            }
        }

        if (self.request.body) {
            let body = self.request.body;
            body = recurrsiveEvaluate(body).evaluate(evaluateContext);
            isMatch = isMatch && recurrsiveCompare(body).compareFunc(req.body);
        }

        return isMatch;
    },

    doContractHandle: (contract, basePath, req, res) => {
        let self = contract;

        let incomeReqPath = req.path.indexOf(basePath) === 0 ? req.path.replace(basePath, '') : req.path;
        let evaluateContext = {
            req: {
                method: req.method,
                basePath: basePath,
                path: incomeReqPath,
                query: req.query,
                body: req.body,
                rawBody: req.rawBody,
                jsonBody: req.jsonBody,
                headers: req.headers
            }
        }
        
        for (let headerKey in self.response.headers) {
            let headerValue = self.response.headers[headerKey];
            headerValue = recurrsiveEvaluate(headerValue).evaluate(evaluateContext);
            headerValue = recurrsiveMock(headerValue).mock();
            res.set(headerKey, headerValue);
        }

        let responseStatus = self.response.status;
        if (Middleware.isMiddleware(responseStatus)) {
            responseStatus = recurrsiveEvaluate(responseStatus).evaluate(evaluateContext);
            responseStatus = recurrsiveMock(responseStatus).mock();
        }

        let responseBody = self.response.body;
        if (typeof responseBody === 'object') {
            responseBody = recurrsiveEvaluate(responseBody).evaluate(evaluateContext);
            responseBody = recurrsiveMock(responseBody).mock();
        }

        res.status(responseStatus).send(responseBody);
        return true;
    }
}


async function startWirestubServer(appId, wirestub) {
    let isPortFree = !(await tcpPortUsed.check(wirestub.port));
    if (isPortFree) {

        let appInstance = express();
        appInstance.use((req, res, next) => {
            req.rawBody = "";
            var data = '';
            req.on('data', (chunk) => {
                data += chunk;
            });
            req.on('end', () => {
                req.rawBody = data;
            });
            next();
        });

        appInstance.use(bodyParser.json({
            limit: '50mb'
        }));
        appInstance.use(bodyParser.urlencoded({
            extended: false,
            limit: '50mb'
        }));
        appInstance.use(bodyParser.raw({
            type: 'application/vnd.js',
            limit: '50mb'
        }));

        appInstance.use((req, res, next) => {
            req.jsonBody = {};
            if (req.body && typeof req.body === 'object') {
                req.jsonBody = req.body;
            }
            next();
        });

        appInstance.appId = appId;

        appInstance.all('*', async function (req, res) {
            let appId = appInstance.appId;
            let [error, app] = (await appServices.get(appId)).get();

            let appBasePath = app.basePath;

            for (let version of app.versions) {
                let v = version.v;
                let versionedPath = version.path;
                let contractIds = version.contracts;

                let basePath = appBasePath;
                if (versionedPath) {
                    basePath = versionedPath.replace(/\{\{app\.basePath}}/g, appBasePath).replace(/\{\{version\.v}}/g, v);
                }

                if (req.originalUrl.indexOf(basePath) !== 0) {
                    continue;
                }

                for (let contractId of contractIds) {
                    let [error, contract] = (await contractServices.get(contractId)).get();
                    if (contract && wirestubServices.shouldContractHandle(contract, basePath, req)) {
                        return wirestubServices.doContractHandle(contract, basePath, req, res);
                    }
                }
            }
            return res.status(404).send('Not found');
        });

        let serverInstance = appInstance.listen(wirestub.port);
        serverInstance = httpShutdown(serverInstance);

        await stubServersStore().set(appId, serverInstance);
        return Result.newSuccess({ code: 201, message: 'Stub server created' });
    } else {
        return Result.newFail({ code: 500, message: 'Internal server error' });
    }
}

async function shutdownWirestubServer(appId) {
    let [error, serverInstance] = (await stubServersStore().get(appId)).get();
    await new Promise((resolve, reject) => {
        serverInstance.forceShutdown(async () => {
            console.log('Wirestub server shutdown.');
            let [error] = (await stubServersStore().delete(appId)).get();
            if (!error) {
                resolve();
            } else {
                reject(error);
            }
        });
    });
    return Result.newSuccess({ code: 204 });
}

module.exports = wirestubServices;