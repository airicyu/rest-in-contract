'use strict';

const {
    wirestub
} = require('./../models/models');
const { Result } = require('stateful-result').models;

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
    create: async(appId, wirestub) => {
        let [error, existingWirestub] = (await wirestubsStore().get(appId)).get();
        if (!existingWirestub) {
            let [error] = (await startWirestubServer(appId, wirestub)).get();
            if (!error) {
                let [error] = (await wirestubsStore().create(appId, wirestub)).get();
                return Result.newSuccess({ code: 201, message: 'Stub server created' });
            }
        } else {
            return Result.newSuccess({ code: 204, message: 'Stub server already running' });
        }
    },

    get: async(appId) => {
        let [error, wirestub] = (await wirestubsStore().get(appId)).get();
        if (wirestub) {
            return Result.newSuccess({ code: 200, data: wirestub });
        } else {
            return Result.newFail({ code: 404, message: 'Wirestub not found' });
        }
    },

    delete: async(appId) => {
        let [error, wirestub] = (await wirestubsStore().get(appId)).get();
        if (wirestub) {
            let [error] = (await shutdownWirestubServer(appId)).get();
            [error] = (await wirestubsStore().delete(appId)).get();
            return Result.newSuccess({ code: 204 });
        } else {
            return Result.newFail({ code: 404, message: 'Wirestub not found' });
        }
    }
}


async function startWirestubServer(appId, wirestub) {
    let isPortFree = !(await tcpPortUsed.check(wirestub.port));
    if (isPortFree) {

        let appInstance = express();
        appInstance.use(bodyParser.json({
            limit: '5mb'
        }));
        appInstance.use(bodyParser.urlencoded({
            extended: true,
            limit: '5mb'
        }));
        appInstance.use(bodyParser.raw({
            type: 'application/vnd.js',
            limit: '5mb'
        }));

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
                    if (contract && contract.isHandle(basePath, req)) {
                        return contract.handle(basePath, req, res);
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
        serverInstance.forceShutdown(async() => {
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