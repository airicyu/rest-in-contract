'use strict';

const should = require('chai').should;
const expect = require('chai').expect;
const supertest = require('supertest');
const dsl = require('rest-in-contract-dsl');
const contractServer = require('./../index.js');
const request = require('request');
const rp = require('request-promise-native');
const path = require('path');
const uuidV4 = require('uuid/v4');

const moduleAPIVersion = require('./../package.json')['api-version'];
const api = contractServer.api;
const models = contractServer.models;
const { App, Version, Contract, Request, Response, Wirestub, Wiretest } = models;

var sampleContractId_1 = "b9135ab0-20d2-43f3-b947-3bac5b061f61";
var sampleContractId_2 = "94923fbd-9092-4a46-ad65-0d8a2e2f551e";

var sampleApp = {
    "id": "80a69a44-3f3b-48c1-a7d1-b34b89117e75",
    "name": "test",
    "servers": ["http://example.com:8001"],
    "basePath": "/api"
}

var sampleApp2 = {
    "name": "test2",
    "servers": ["http://example.com:8002"],
    "basePath": "/api"
};

var sampleVersion = {
    "v": "0.0.1",
    "path": "{{app.basePath}}/v{{version.v}}",
    "contracts": [
        "b9135ab0-20d2-43f3-b947-3bac5b061f61",
        "94923fbd-9092-4a46-ad65-0d8a2e2f551e"
    ]
}

var sampleVersion2 = {
    "v": "0.0.2",
    "path": "{{app.basePath}}/v{{version.v}}",
    "contracts": []
}

describe('Test start server', function () {
    this.timeout(2000);

    var serverInstance = null;
    beforeEach(function (done) {
        serverInstance = contractServer.initServer({
            port: 8000
        });
        done();
    });

    afterEach(function (done) {
        contractServer.shutdownServer(serverInstance).then(async() => {
            await contractServer.stores.reset();
            done();
        });
    });

    it("Test server start OK", function (done) {
        (async function () {
            var body = await rp.get('http://localhost:8000/api');
            expect(body).to.equal('OK');
            return done();
        })().catch((err) => {
            return done(err);
        });
    });

    it("Test server get API version", function (done) {
        (async function () {
            var body = await rp.get('http://localhost:8000/api/v');
            expect(body).to.equal(moduleAPIVersion);
            return done();
        })().catch((err) => {
            return done(err);
        });
    });

});


describe('Test import', function () {
    this.timeout(2000);

    var serverInstance = null;
    beforeEach(function (done) {
        serverInstance = contractServer.initServer({
            port: 8000
        });
        done();
    });

    afterEach(function (done) {
        contractServer.shutdownServer(serverInstance).then(async() => {
            await contractServer.stores.reset();
            done();
        });
    })

    it("Test import via API", function (done) {
        (async function () {
            var body = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/`, {
                    json: true
                });
            })();
            expect(Array.isArray(body)).to.true;
            expect(body.length).to.equal(0);

            var response = await (async function () {
                return rp.post(`http://localhost:8000/api/v${moduleAPIVersion}/importAppsFiles`, {
                    body: {
                        "appFolder": __dirname.replace('\\', '/') + '/testImportData/sample_import_app_folder'
                    },
                    json: true,
                    resolveWithFullResponse: true
                });
            })();
            expect(response.body).to.equal('importAppsFiles done');

            body = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/`, {
                    json: true
                });
            })();
            expect(Array.isArray(body)).to.true;
            expect(body.length).to.equal(1);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test import via REST API", function (done) {
        (async function () {
            var body = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/`, {
                    json: true
                });
            })();
            expect(Array.isArray(body)).to.true;
            expect(body.length).to.equal(0);


            await api.importAppsFiles(__dirname.replace('\\', '/') + '/testImportData/sample_import_app_folder');

            body = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/`, {
                    json: true
                });
            })();
            expect(Array.isArray(body)).to.true;
            expect(body.length).to.equal(1);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

});

describe('Test API', function () {
    this.timeout(2000);

    var serverInstance = null;
    beforeEach(function (done) {
        serverInstance = contractServer.initServer({
            port: 8000
        });

        importFiles(done);
    });

    afterEach(function (done) {
        contractServer.shutdownServer(serverInstance).then(async() => {
            await contractServer.stores.reset();
            done();
        });
    });

    function importFiles(cb) {
        return contractServer.api.importAppsFiles(__dirname.replace('\\', '/') + '/testImportData/sample_import_app_folder')
            .then(cb);
    }

    it("Test create app via API", function (done) {
        (async function () {

            var [error, appIds] = (await api.app.get()).get();
            var numApps = appIds.length;

            var app = new App(sampleApp2);
            var [error, data, code, result] = (await api.app.create(app)).get();
            expect(error).to.be.null;
            expect(code).to.equal(201);

            [error, appIds] = (await api.app.get()).get();
            expect(appIds.length).to.equal(numApps+1);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test create app via REST API", function (done) {
        (async function () {

            var [error, appIds] = (await api.app.get()).get();
            var numApps = appIds.length;

            var response = await (async function () {
                return rp.post(`http://localhost:8000/api/v${moduleAPIVersion}/apps`, {
                    body: sampleApp2,
                    json: true,
                    resolveWithFullResponse: true
                });
            })();
            expect(response.statusCode).to.equal(201);
            expect(response.body).to.equal('App created');

            [error, appIds] = (await api.app.get()).get();
            expect(appIds.length).to.equal(numApps+1);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test get app via API", function (done) {
        (async function () {
            var [error, appIds, code, result] = (await api.app.get()).get();
            expect(error).to.be.null;
            expect(code).to.equal(200);
            expect(Array.isArray(appIds)).to.true;
            expect(appIds.length).to.equal(1);

            var [error, app] = (await api.app.get(sampleApp.id)).get();
            expect(app).to.instanceOf(App);
            expect(app.id).to.equal(sampleApp.id);
            expect(app.name).to.equal(sampleApp.name);
            expect(app.servers[0]).to.equal(sampleApp.servers[0]);
            expect(app.basePath).to.equal(sampleApp.basePath);
            expect(app.versions[0].v).to.equal('0.0.1');
            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test get app via REST API", function (done) {
        (async function () {

            var appIds = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/`, {
                    json: true
                });
            })();
            expect(Array.isArray(appIds)).to.true;
            expect(appIds.length).to.equal(1);

            var app = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${sampleApp.id}`, {
                    json: true
                });
            })();

            expect(app.id).to.equal(sampleApp.id);
            expect(app.name).to.equal(sampleApp.name);
            expect(app.servers[0]).to.equal(sampleApp.servers[0]);
            expect(app.basePath).to.equal(sampleApp.basePath);
            expect(app.versionNumbers[0]).to.equal('0.0.1');
            expect(app['_links']).to.eql({
                self: { href: '/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75' },
                versions: { href: '/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions' }
            });

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test update app via API", function (done) {
        (async function () {

            var [error, app] = (await api.app.get(sampleApp.id)).get();
            app.name = "test_renamed";
            await api.app.update(app);

            var [error, app] = (await api.app.get(sampleApp.id)).get();
            expect(app).to.instanceOf(App);
            expect(app.id).to.equal(sampleApp.id);
            expect(app.name).to.equal('test_renamed');
            expect(app.servers[0]).to.equal(sampleApp.servers[0]);
            expect(app.basePath).to.equal(sampleApp.basePath);
            expect(app.versions[0].v).to.equal('0.0.1');

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test update app via REST API", function (done) {
        (async function () {

            var updateApp = JSON.parse(JSON.stringify(sampleApp));
            updateApp.name = "test_renamed";
            var response = await (async function () {
                return rp.put(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${updateApp.id}`, {
                    body: updateApp,
                    json: true,
                    resolveWithFullResponse: true
                });
            })();
            expect(response.statusCode).to.equal(204);

            var [error, app] = (await api.app.get(sampleApp.id)).get();
            expect(app).to.instanceOf(App);
            expect(app.id).to.equal(sampleApp.id);
            expect(app.name).to.equal('test_renamed');
            expect(app.servers[0]).to.equal(sampleApp.servers[0]);
            expect(app.basePath).to.equal(sampleApp.basePath);
            expect(app.versions[0].v).to.equal('0.0.1');

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test delete app via API", function (done) {
        (async function () {

            var [error, data, code, result] = (await api.app.delete(sampleApp.id)).get();
            expect(error).to.be.null;
            expect(data).to.be.undefined;
            expect(code).to.be.equal(204);

            var [error, apps] = (await api.app.get()).get();
            expect(apps.length).to.be.equal(0);
            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test delete app via REST API", function (done) {
        (async function () {

            var response = await (async function () {
                return rp.delete(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${sampleApp.id}`, {
                    resolveWithFullResponse: true
                });
            })();
            expect(response.statusCode).to.equal(204);

            var [error, apps] = (await api.app.get()).get();
            expect(apps.length).to.be.equal(0);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test create app version via API", function (done) {
        (async function () {
            var [error, versionNumbers] = (await api.app.version.get(sampleApp.id)).get();
            var numVersions = versionNumbers.length;

            var version = new Version(sampleVersion2);
            var [error, data, code, result] = (await api.app.version.create(sampleApp.id, version)).get();
            expect(error).to.be.null;
            expect(code).to.equal(201);

            [error, versionNumbers] = (await api.app.version.get(sampleApp.id)).get();
            expect(versionNumbers.length).to.equal(numVersions+1);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test create app version via REST API", function (done) {
        (async function () {

            var [error, versionNumbers] = (await api.app.version.get(sampleApp.id)).get();
            var numVersions = versionNumbers.length;

            var response = await (async function () {
                return rp.post(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${sampleApp.id}/versions`, {
                    body: sampleVersion2,
                    json: true,
                    resolveWithFullResponse: true
                });
            })();
            expect(response.statusCode).to.equal(201);
            expect(response.body).to.equal('Version created');

            [error, versionNumbers] = (await api.app.version.get(sampleApp.id)).get();
            expect(versionNumbers.length).to.equal(numVersions+1);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test get app version via API", function (done) {
        (async function () {
            var [error, versionNumbers, code, result] = (await api.app.version.get(sampleApp.id)).get();
            expect(error).to.be.null;
            expect(code).to.equal(200);
            expect(Array.isArray(versionNumbers)).to.true;
            expect(versionNumbers.length).to.equal(1);

            var [error, version] = (await api.app.version.get(sampleApp.id, sampleVersion.v)).get();
            expect(version).to.instanceOf(Version);
            expect(version.v).to.equal(sampleVersion.v);
            expect(version.path).to.equal(sampleVersion.path);
            expect(version.contracts.length).to.equal(sampleVersion.contracts.length);
            for(var contract of sampleVersion.contracts){
                expect(version.contracts.includes(contract)).to.be.true;
            }
            
            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test get app version via REST API", function (done) {
        (async function () {
            var versionNumbers = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${sampleApp.id}/versions`, {
                    json: true
                });
            })();
            expect(Array.isArray(versionNumbers)).to.true;
            expect(versionNumbers.length).to.equal(1);

            var version = await (async function () {
                return rp.get(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${sampleApp.id}/versions/${sampleVersion.v}`, {
                    json: true
                });
            })();

            expect(version.v).to.equal(sampleVersion.v);
            expect(version.path).to.equal(sampleVersion.path);
            expect(version.contracts.length).to.equal(sampleVersion.contracts.length);
            for(var contract of sampleVersion.contracts){
                expect(version.contracts.includes(contract)).to.be.true;
            }
            expect(version['_links']).to.eql({
                self: { href: `/api/v1/apps/${sampleApp.id}/versions/${sampleVersion.v}` },
                parent: { href: `/api/v1/apps/${sampleApp.id}` },
                contracts: { href: `/api/v1/apps/${sampleApp.id}/versions/${sampleVersion.v}/contracts` }
            });

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test update app version via API", function (done) {
        (async function () {

            var [error, version] = (await api.app.version.get(sampleApp.id, sampleVersion.v)).get();
            version.path = '{{app.basePath}}/_v{{version.v}}';
            await api.app.version.update(sampleApp.id, version);

            var [error, version] = (await api.app.version.get(sampleApp.id, sampleVersion.v)).get();
            expect(version).to.instanceOf(Version);
            expect(version.v).to.equal(sampleVersion.v);
            expect(version.path).to.equal('{{app.basePath}}/_v{{version.v}}');
            expect(version.contracts.length).to.equal(sampleVersion.contracts.length);
            for(var contract of sampleVersion.contracts){
                expect(version.contracts.includes(contract)).to.be.true;
            }

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test update app version via REST API", function (done) {
        (async function () {

            var updateVersion = JSON.parse(JSON.stringify(sampleVersion));
            updateVersion.path = '{{app.basePath}}/_v{{version.v}}';
            var response = await (async function () {
                return rp.put(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${sampleApp.id}/versions/${sampleVersion.v}`, {
                    body: updateVersion,
                    json: true,
                    resolveWithFullResponse: true
                });
            })();
            expect(response.statusCode).to.equal(204);

            var [error, version] = (await api.app.version.get(sampleApp.id, sampleVersion.v)).get();
            expect(version).to.instanceOf(Version);
            expect(version.v).to.equal(sampleVersion.v);
            expect(version.path).to.equal('{{app.basePath}}/_v{{version.v}}');
            expect(version.contracts.length).to.equal(sampleVersion.contracts.length);
            for(var contract of sampleVersion.contracts){
                expect(version.contracts.includes(contract)).to.be.true;
            }

            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test delete app version via API", function (done) {
        (async function () {

            var [error, data, code, result] = (await api.app.version.delete(sampleApp.id, sampleVersion.v)).get();
            expect(error).to.be.null;
            expect(data).to.be.undefined;
            expect(code).to.be.equal(204);

            var [error, versionNumbers] = (await api.app.version.get(sampleApp.id)).get();
            expect(versionNumbers.length).to.be.equal(0);
            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test delete app version via REST API", function (done) {
        (async function () {

            var response = await (async function () {
                return rp.delete(`http://localhost:8000/api/v${moduleAPIVersion}/apps/${sampleApp.id}/versions/${sampleVersion.v}`, {
                    resolveWithFullResponse: true
                });
            })();
            expect(response.statusCode).to.equal(204);

            var [error, versionNumbers] = (await api.app.version.get(sampleApp.id)).get();
            expect(versionNumbers.length).to.be.equal(0);

            return done();
        })().catch((err) => {
            return done(err);
        });

    });
    /*
        app: {
                create: async(app) => {
                    return appServices.create(app);
                },
                get: async(appId) => {
                    return appServices.get(appId);
                },
                update: async(app) => {
                    return appServices.update(app);
                },
                delete: async(appId) => {
                    return appServices.delete(appId);
                },
                wirestub: {
                    create: async(appId, wirestub) => {
                        return wirestubServices.create(appId, wirestub);
                    },
                    get: async(appId) => {
                        return wirestubServices.get(appId);
                    },
                    delete: async(appId) => {
                        return wirestubServices.delete(appId);
                    },
                },
                contractTest: {
                    post: async(appId, wiretest) => {
                        return contractTestServices.appWiretest(appId, wiretest);
                    }
                },
                version: {
                    create: async(appId, version) => {
                        return versionServices.create(appId, version);
                    },
                    get: async(appId, versionId) => {
                        return versionServices.get(appId, versionId);
                    },
                    update: async(appId, version) => {
                        return versionServices.update(app, version);
                    },
                    delete: async(appId, versionId) => {
                        return versionServices.delete(appId, versionId);
                    },
                },
            },
            contract: {
                create: async(contract) => {
                    return contractServices.create(contract);
                },
                get: async(contractId) => {
                    return contractServices.get(contractId);
                },
                update: async(contract) => {
                    return contractServices.update(contract);
                },
                delete: async(contractId) => {
                    return contractServices.delete(contractId);
                },
            },
            importAppsFiles: importHelper.importAppsFiles
        */

});

describe('Test', function () {
    this.timeout(2000);

    var serverInstance = null;
    beforeEach(function (done) {
        serverInstance = contractServer.initServer({
            port: 8000
        });
        done();
    });

    afterEach(function (done) {
        contractServer.shutdownServer(serverInstance).then(async() => {
            await contractServer.stores.reset();
            done();
        });
    });

    it("Test model", function (done) {
        (async function () {
            return done();
        })().catch((err) => {
            return done(err);
        });

    });

    it("Test stores", function (done) {
        (async function () {
            return done();
        })().catch((err) => {
            return done(err);
        });
    });

});