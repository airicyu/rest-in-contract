"use strict";

const should = require("chai").should;
const expect = require("chai").expect;
const supertest = require("supertest");
const dsl = require("rest-in-contract-dsl");
const contractServer = require("./../index.js");
const request = require("request");
const rp = require("request-promise-native");
const path = require("path");
const uuidV4 = require("uuid/v4");
const beautify = require("js-beautify").js_beautify;
const fs = require("fs");

const moduleAPIVersion = require("./../package.json")["api-version"];
const api = contractServer.api;
const models = contractServer.models;
const {
  App,
  Version,
  Contract,
  Request,
  Response,
  Wirestub,
  Wiretest
} = models;

var sampleApp = {
  id: "80a69a44-3f3b-48c1-a7d1-b34b89117e75",
  name: "test",
  servers: ["http://example.com:8001"],
  basePath: "/api"
};

var sampleApp2 = {
  name: "test2",
  servers: ["http://example.com:8002"],
  basePath: "/api"
};

var sampleVersion = {
  v: "0.0.1",
  path: "{{app.basePath}}/v{{version.v}}",
  contracts: [
    "5ce2be34-0aff-4b09-ae89-014e479ec072",
    "b9135ab0-20d2-43f3-b947-3bac5b061f61",
    "94923fbd-9092-4a46-ad65-0d8a2e2f551e"
  ]
};

var sampleVersion2 = {
  v: "0.0.2",
  path: "{{app.basePath}}/v{{version.v}}",
  contracts: []
};

var sampleContractId_1 = "b9135ab0-20d2-43f3-b947-3bac5b061f61";
var sampleContractId_2 = "94923fbd-9092-4a46-ad65-0d8a2e2f551e";

var sampleContractScript_1 = beautify(
  fs.readFileSync(
    __dirname+'/testImportData/sample_import_app_folder/helloWorld/versions/0.0.1/contracts/function examples.js', 'utf-8'
  ),
  { indent_size: 2 }
);

var sampleNewContractScript = `
var dsl = require('rest-in-contract-dsl');
var { evalContext } = dsl.functions;

module.exports =
    {
        "name": "sample contract",
        "request": {
            "method": ["GET", "POST"],
            "urlPath": "/sample"
        },
        "response": {
            "status": 200,
            "body": evalContext(function (context) {
                return context.req.rawBody;
            })
        }
    }
`;

describe("Test start server", function() {
  this.timeout(2000);

  var serverInstance = null;
  beforeEach(function(done) {
    serverInstance = contractServer.initServer({
      port: 8000
    });
    done();
  });

  afterEach(function(done) {
    contractServer.shutdownServer(serverInstance).then(async () => {
      await contractServer.stores.reset();
      done();
    });
  });

  it("Test server start OK", function(done) {
    (async function() {
      try {
        var body = await rp.get("http://localhost:8000/api");
        expect(body).to.equal("OK");
        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test server get API version", function(done) {
    (async function() {
      try {
        var body = await rp.get("http://localhost:8000/api/v");
        expect(body).to.equal(moduleAPIVersion);
        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });
});

describe("Test import", function() {
  this.timeout(2000);

  var serverInstance = null;
  beforeEach(function(done) {
    serverInstance = contractServer.initServer({
      port: 8000
    });
    done();
  });

  afterEach(function(done) {
    contractServer.shutdownServer(serverInstance).then(async () => {
      await contractServer.stores.reset();
      done();
    });
  });

  it("Test import via API", function(done) {
    (async function() {
      try {
        var body = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/`,
            {
              json: true
            }
          );
        })();
        expect(Array.isArray(body)).to.true;
        expect(body.length).to.equal(0);

        var response = await (async function() {
          return rp.post(
            `http://localhost:8000/api/v${moduleAPIVersion}/importAppsFiles`,
            {
              body: {
                appFolder:
                  __dirname.replace("\\", "/") +
                  "/testImportData/sample_import_app_folder"
              },
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.body).to.equal("importAppsFiles done");

        body = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/`,
            {
              json: true
            }
          );
        })();
        expect(Array.isArray(body)).to.true;
        expect(body.length).to.equal(1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test import via REST API", function(done) {
    (async function() {
      try {
        var body = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/`,
            {
              json: true
            }
          );
        })();
        expect(Array.isArray(body)).to.true;
        expect(body.length).to.equal(0);

        await api.importAppsFiles(
          __dirname.replace("\\", "/") +
            "/testImportData/sample_import_app_folder"
        );

        body = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/`,
            {
              json: true
            }
          );
        })();
        expect(Array.isArray(body)).to.true;
        expect(body.length).to.equal(1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });
});

describe("Test API", function() {
  this.timeout(2000);

  var serverInstance = null;
  beforeEach(function(done) {
    serverInstance = contractServer.initServer({
      port: 8000
    });

    importFiles(done);
  });

  afterEach(function(done) {
    contractServer.shutdownServer(serverInstance).then(async () => {
      await contractServer.stores.reset();
      done();
    });
  });

  function importFiles(cb) {
    return contractServer.api
      .importAppsFiles(
        __dirname.replace("\\", "/") +
          "/testImportData/sample_import_app_folder"
      )
      .then(cb);
  }

  it("Test create app via API", function(done) {
    (async function() {
      try {
        var [error, appIds] = (await api.app.get()).get();
        var numApps = appIds.length;

        var app = new App(sampleApp2);
        var [error, data, code] = (await api.app.create(app)).get();
        expect(error).to.be.null;
        expect(code).to.equal(201);

        [error, appIds] = (await api.app.get()).get();
        expect(appIds.length).to.equal(numApps + 1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test create app via REST API", function(done) {
    (async function() {
      try {
        var [error, appIds] = (await api.app.get()).get();
        var numApps = appIds.length;

        var response = await (async function() {
          return rp.post(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps`,
            {
              body: sampleApp2,
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(201);
        expect(response.body).to.equal("App created");

        [error, appIds] = (await api.app.get()).get();
        expect(appIds.length).to.equal(numApps + 1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test get app via API", function(done) {
    (async function() {
      try {
        var [error, appIds, code] = (await api.app.get()).get();
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
        expect(app.versions[0].v).to.equal("0.0.1");
        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test get app via REST API", function(done) {
    (async function() {
      try {
        var appIds = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/`,
            {
              json: true
            }
          );
        })();
        expect(Array.isArray(appIds)).to.true;
        expect(appIds.length).to.equal(1);

        var app = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }`,
            {
              json: true
            }
          );
        })();

        expect(app.id).to.equal(sampleApp.id);
        expect(app.name).to.equal(sampleApp.name);
        expect(app.servers[0]).to.equal(sampleApp.servers[0]);
        expect(app.basePath).to.equal(sampleApp.basePath);
        expect(app.versionNumbers[0]).to.equal("0.0.1");
        expect(app["_links"]).to.eql({
          self: { href: "/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75" },
          versions: {
            href: "/api/v1/apps/80a69a44-3f3b-48c1-a7d1-b34b89117e75/versions"
          }
        });

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test update app via API", function(done) {
    (async function() {
      try {
        var [error, app] = (await api.app.get(sampleApp.id)).get();
        app.name = "test_renamed";
        await api.app.update(app);

        var [error, app] = (await api.app.get(sampleApp.id)).get();
        expect(app).to.instanceOf(App);
        expect(app.id).to.equal(sampleApp.id);
        expect(app.name).to.equal("test_renamed");
        expect(app.servers[0]).to.equal(sampleApp.servers[0]);
        expect(app.basePath).to.equal(sampleApp.basePath);
        expect(app.versions[0].v).to.equal("0.0.1");

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test update app via REST API", function(done) {
    (async function() {
      try {
        var updateApp = JSON.parse(JSON.stringify(sampleApp));
        updateApp.name = "test_renamed";
        var response = await (async function() {
          return rp.put(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              updateApp.id
            }`,
            {
              body: updateApp,
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(204);

        var [error, app] = (await api.app.get(sampleApp.id)).get();
        expect(app).to.instanceOf(App);
        expect(app.id).to.equal(sampleApp.id);
        expect(app.name).to.equal("test_renamed");
        expect(app.servers[0]).to.equal(sampleApp.servers[0]);
        expect(app.basePath).to.equal(sampleApp.basePath);
        expect(app.versions[0].v).to.equal("0.0.1");

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test delete app via API", function(done) {
    (async function() {
      try {
        var [error, data, code] = (await api.app.delete(sampleApp.id)).get();
        expect(error).to.be.null;
        expect(data).to.be.undefined;
        expect(code).to.be.equal(204);

        var [error, apps] = (await api.app.get()).get();
        expect(apps.length).to.be.equal(0);
        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test delete app via REST API", function(done) {
    (async function() {
      try {
        var response = await (async function() {
          return rp.delete(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }`,
            {
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(204);

        var [error, apps] = (await api.app.get()).get();
        expect(apps.length).to.be.equal(0);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test create app version via API", function(done) {
    (async function() {
      try {
        var [error, versionNumbers] = (await api.app.version.get(
          sampleApp.id
        )).get();
        var numVersions = versionNumbers.length;

        var version = new Version(sampleVersion2);
        var [error, data, code] = (await api.app.version.create(
          sampleApp.id,
          version
        )).get();
        expect(error).to.be.null;
        expect(code).to.equal(201);

        [error, versionNumbers] = (await api.app.version.get(
          sampleApp.id
        )).get();
        expect(versionNumbers.length).to.equal(numVersions + 1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test create app version via REST API", function(done) {
    (async function() {
      try {
        var [error, versionNumbers] = (await api.app.version.get(
          sampleApp.id
        )).get();
        var numVersions = versionNumbers.length;

        var response = await (async function() {
          return rp.post(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/versions`,
            {
              body: sampleVersion2,
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(201);
        expect(response.body).to.equal("Version created");

        [error, versionNumbers] = (await api.app.version.get(
          sampleApp.id
        )).get();
        expect(versionNumbers.length).to.equal(numVersions + 1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test get app version via API", function(done) {
    (async function() {
      try {
        var [error, versionNumbers, code] = (await api.app.version.get(
          sampleApp.id
        )).get();
        expect(error).to.be.null;
        expect(code).to.equal(200);
        expect(Array.isArray(versionNumbers)).to.true;
        expect(versionNumbers.length).to.equal(1);

        var [error, version] = (await api.app.version.get(
          sampleApp.id,
          sampleVersion.v
        )).get();
        expect(version).to.instanceOf(Version);
        expect(version.v).to.equal(sampleVersion.v);
        expect(version.path).to.equal(sampleVersion.path);
        expect(version.contracts.length).to.equal(
          sampleVersion.contracts.length
        );
        for (var contract of sampleVersion.contracts) {
          expect(version.contracts.includes(contract)).to.be.true;
        }

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test get app version via REST API", function(done) {
    (async function() {
      try {
        var versionNumbers = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/versions`,
            {
              json: true
            }
          );
        })();
        expect(Array.isArray(versionNumbers)).to.true;
        expect(versionNumbers.length).to.equal(1);

        var version = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/versions/${sampleVersion.v}`,
            {
              json: true
            }
          );
        })();

        expect(version.v).to.equal(sampleVersion.v);
        expect(version.path).to.equal(sampleVersion.path);
        expect(version.contracts.length).to.equal(
          sampleVersion.contracts.length
        );
        for (var contract of sampleVersion.contracts) {
          expect(version.contracts.includes(contract)).to.be.true;
        }
        expect(version["_links"]).to.eql({
          self: {
            href: `/api/v1/apps/${sampleApp.id}/versions/${sampleVersion.v}`
          },
          parent: { href: `/api/v1/apps/${sampleApp.id}` },
          contracts: {
            href: `/api/v1/apps/${sampleApp.id}/versions/${
              sampleVersion.v
            }/contracts`
          }
        });

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test update app version via API", function(done) {
    (async function() {
      try {
        var [error, version] = (await api.app.version.get(
          sampleApp.id,
          sampleVersion.v
        )).get();
        version.path = "{{app.basePath}}/_v{{version.v}}";
        await api.app.version.update(sampleApp.id, version);

        var [error, version] = (await api.app.version.get(
          sampleApp.id,
          sampleVersion.v
        )).get();
        expect(version).to.instanceOf(Version);
        expect(version.v).to.equal(sampleVersion.v);
        expect(version.path).to.equal("{{app.basePath}}/_v{{version.v}}");
        expect(version.contracts.length).to.equal(
          sampleVersion.contracts.length
        );
        for (var contract of sampleVersion.contracts) {
          expect(version.contracts.includes(contract)).to.be.true;
        }

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test update app version via REST API", function(done) {
    (async function() {
      try {
        var updateVersion = JSON.parse(JSON.stringify(sampleVersion));
        updateVersion.path = "{{app.basePath}}/_v{{version.v}}";
        var response = await (async function() {
          return rp.put(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/versions/${sampleVersion.v}`,
            {
              body: updateVersion,
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(204);

        var [error, version] = (await api.app.version.get(
          sampleApp.id,
          sampleVersion.v
        )).get();
        expect(version).to.instanceOf(Version);
        expect(version.v).to.equal(sampleVersion.v);
        expect(version.path).to.equal("{{app.basePath}}/_v{{version.v}}");
        expect(version.contracts.length).to.equal(
          sampleVersion.contracts.length
        );
        for (var contract of sampleVersion.contracts) {
          expect(version.contracts.includes(contract)).to.be.true;
        }

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test delete app version via API", function(done) {
    (async function() {
      try {
        var [error, data, code] = (await api.app.version.delete(
          sampleApp.id,
          sampleVersion.v
        )).get();
        expect(error).to.be.null;
        expect(data).to.be.undefined;
        expect(code).to.be.equal(204);

        var [error, versionNumbers] = (await api.app.version.get(
          sampleApp.id
        )).get();
        expect(versionNumbers.length).to.be.equal(0);
        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test delete app version via REST API", function(done) {
    (async function() {
      try {
        var response = await (async function() {
          return rp.delete(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/versions/${sampleVersion.v}`,
            {
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(204);

        var [error, versionNumbers] = (await api.app.version.get(
          sampleApp.id
        )).get();
        expect(versionNumbers.length).to.be.equal(0);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  //   contract: {
  //     create: async(contract) => {
  //         return contractServices.create(contract);
  //     },
  //     get: async(contractId) => {
  //         return contractServices.get(contractId);
  //     },
  //     update: async(contract) => {
  //         return contractServices.update(contract);
  //     },
  //     delete: async(contractId) => {
  //         return contractServices.delete(contractId);
  //     },
  // },

  it("Test create app contract via API", function(done) {
    (async function() {
      try {
        let error, contractIds, data, code;
        [error, contractIds] = (await api.contract.get()).get();
        let numContracts = contractIds.length;

        let newContract = Contract.newFromScript(sampleNewContractScript);
        [error, data, code] = (await api.contract.create(newContract)).get();
        expect(error).to.be.null;
        expect(code).to.equal(201);

        [error, contractIds] = (await api.contract.get()).get();
        expect(contractIds.length).to.equal(numContracts + 1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test create app contract via REST API", function(done) {
    (async function() {
      try {
        let error, contractIds, data, code;
        [error, contractIds] = (await api.contract.get()).get();
        let numContracts = contractIds.length;

        var response = await (async function() {
          return rp.post(
            `http://localhost:8000/api/v${moduleAPIVersion}/contracts`,
            {
              body: sampleNewContractScript,
              headers: {
                "Content-type": "application/vnd.js.contract"
              },
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(201);
        expect(response.body).to.equal("Contract created");

        [error, contractIds] = (await api.contract.get()).get();
        expect(contractIds.length).to.equal(numContracts + 1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test get app contract via API", function(done) {
    (async function() {
      try {
        let error, contract, code;
        [error, contract, code] = (await api.contract.get(
          sampleContractId_1
        )).get();
        expect(error).to.be.null;
        expect(code).to.equal(200);

        expect(contract).to.be.not.null;
        expect(contract.id).to.equal(sampleContractId_1);
        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test get app contract via REST API", function(done) {
    (async function() {
      try {
        let error, contract, code, response;

        response = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/contracts/${sampleContractId_1}`,
            {
              headers: {
                "Accept": "application/vnd.js.contract"
              },
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.equal(sampleContractScript_1);

        response = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/contracts/${sampleContractId_1}`,
            {
              headers: {
                "Accept": "application/json"
              },
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(200);
        expect(response.body.id).to.equal(sampleContractId_1);
        expect(response.body.contractScript).to.equal(sampleContractScript_1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test delete app contract via API", function(done) {
    (async function() {
      try {
        let error, contractIds, code, numContracts, numContracts2, _;
        [error, contractIds, code] = (await api.contract.get()).get();
        numContracts = contractIds.length;

        [error, _, code] = (await api.contract.delete(sampleContractId_1)).get();

        [error, contractIds, code] = (await api.contract.get()).get();
        numContracts2 = contractIds.length;

        expect(numContracts2).to.equal(numContracts - 1);
        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test delete app contract via REST API", function(done) {
    (async function() {
      try {
        let error, contractIds, code, response, numContracts, numContracts2;
        [error, contractIds, code] = (await api.contract.get()).get();
        numContracts = contractIds.length;

        response = await (async function() {
          return rp.delete(
            `http://localhost:8000/api/v${moduleAPIVersion}/contracts/${sampleContractId_1}`,
            {
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(204);

        [error, contractIds, code] = (await api.contract.get()).get();
        numContracts2 = contractIds.length;

        expect(numContracts2).to.equal(numContracts - 1);

        return done();
      } catch (e) {
        return done(e);
      }
    })();
  });

  it("Test app wirestub via API", function(done) {
    (async function() {
      try {
        let error, data, code, wireStub, response;

        //test create wirestub
        [error, data, code] = (await api.app.wirestub.create(
          sampleApp.id,
          new Wirestub({ port: 8001 })
        )).get();
        expect(error).to.be.null;
        expect(code).to.equal(201);

        //test create existing wirestub error
        [error, data, code] = (await api.app.wirestub.create(
          sampleApp.id,
          new Wirestub({ port: 8001 })
        )).get();
        expect(code).to.equal(200);

        //test get wirestub
        [error, wireStub] = (await api.app.wirestub.get(sampleApp.id)).get();
        expect(wireStub).to.be.not.null;
        expect(wireStub.port).to.equal(8001);

        //test get wrirestub not found
        [error, wireStub, code] = (await api.app.wirestub.get('dummy-non-exist-id')).get();
        expect(error).to.be.not.null;
        expect(code).to.equal(404);

        //test wirestub active
        response = await (async function() {
          return rp.post(`http://localhost:8001/api/v0.0.1/echo`, {
            body: { message: "hello" },
            json: true,
            resolveWithFullResponse: true
          });
        })();
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.eqls({ message: "hello" });

        //test delete wirestub
        [error, data, code] = (await api.app.wirestub.delete(
          sampleApp.id,
          new Wirestub({ port: 8080 })
        )).get();
        expect(error).to.be.null;
        expect(code).to.equal(204);
        return done();
      } catch (e) {
        return done(e);
      } finally {
        try {
          //try close wiredstub to prevent blocking unit test finish
          await api.app.wirestub.delete(
            sampleApp.id,
            new Wirestub({ port: 8001 })
          );
        } catch (e) {}
      }
    })();
  });

  it("Test app wirestub via REST API", function(done) {
    (async function() {
      try {
        let response, error;

        //test create wirestub
        response = await (async function() {
          return rp.post(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/wirestubs`,
            {
              body: { port: 8001 },
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(201);
        expect(response.body).to.equal("Wirestub created");

        //test create existing wirestub error
        response = await (async function() {
          return rp.post(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/wirestubs`,
            {
              body: { port: 8001 },
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(200);

        //test get wirestub
        response = await (async function() {
          return rp.get(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/wirestubs`,
            {
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.equals('{"port":8001}');

        //test get wrireStub not found
        error = null;
        try{
          response = await (async function() {
            return rp.get(
              `http://localhost:8000/api/v${moduleAPIVersion}/apps/dummy-non-exist-id/wirestubs`,
              {
                resolveWithFullResponse: true
              }
            );
          })();
        } catch (e){
          error = e;
        }
        expect(error).to.be.not.null;
        expect(error.statusCode).to.equal(404);

        //test wirestub active
        response = await (async function() {
          return rp.post(`http://localhost:8001/api/v0.0.1/echo`, {
            body: { message: "hello" },
            json: true,
            resolveWithFullResponse: true
          });
        })();
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.eqls({ message: "hello" });

        //test delete wirestub
        response = await (async function() {
          return rp.delete(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/wirestubs`,
            {
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(204);

        return done();
      } catch (e) {
        return done(e);
      } finally {
        try {
          //try close wiredstub to prevent blocking unit test finish
          await api.app.wirestub.delete(
            sampleApp.id,
            new Wirestub({ port: 8001 })
          );
        } catch (e) {}
      }
    })();
  });

  it("Test app wiretest via API", function(done) {
    (async function() {
      try {
        let error, data, code, wireStub, testAppResult;

        [error, data, code] = (await api.app.wirestub.create(
          sampleApp.id,
          new Wirestub({ port: 8001 })
        )).get();

        [error, testAppResult, code] = (await api.app.wiretest.post(
          sampleApp.id,
          new Wiretest({ server: "http://localhost:8001" })
        )).get();
        expect(error).to.be.null;
        expect(code).to.equal(200);

        expect(testAppResult).to.be.not.null;
        expect(testAppResult.testInfo.success).to.be.true;

        for (let testVersionResult of testAppResult.results) {
          expect(testVersionResult.testInfo.success).to.be.true;
          for (let testContractResult of testVersionResult.results) {
            expect(testContractResult.testInfo.success).to.be.true;
          }
        }
        done();
      } catch (e) {
        return done(e);
      } finally {
        try {
          //try close wired stub to prevent blocking unit test finish
          await api.app.wirestub.delete(
            sampleApp.id,
            new Wirestub({ port: 8001 })
          );
        } catch (e) {}
      }
    })();
  });

  it("Test app wiretest via REST API", function(done) {
    (async function() {
      try {
        let error, data, code, wireStub, testAppResult;

        [error, data, code] = (await api.app.wirestub.create(
          sampleApp.id,
          new Wirestub({ port: 8001 })
        )).get();

        var response = await (async function() {
          return rp.post(
            `http://localhost:8000/api/v${moduleAPIVersion}/apps/${
              sampleApp.id
            }/wiretests`,
            {
              body: { server: "http://localhost:8001" },
              json: true,
              resolveWithFullResponse: true
            }
          );
        })();
        expect(response.statusCode).to.equal(200);
        testAppResult = response.body;

        expect(testAppResult).to.be.not.null;
        expect(testAppResult.testInfo.success).to.be.true;

        for (let testVersionResult of testAppResult.results) {
          expect(testVersionResult.testInfo.success).to.be.true;
          for (let testContractResult of testVersionResult.results) {
            expect(testContractResult.testInfo.success).to.be.true;
          }
        }
        done();
      } catch (e) {
        return done(e);
      } finally {
        try {
          //try close wired stub to prevent blocking unit test finish
          await api.app.wirestub.delete(
            sampleApp.id,
            new Wirestub({ port: 8001 })
          );
        } catch (e) {}
      }
    })();
  });
});

describe("Test", function() {
  this.timeout(2000);

  var serverInstance = null;
  beforeEach(function(done) {
    serverInstance = contractServer.initServer({
      port: 8000
    });
    done();
  });

  afterEach(function(done) {
    contractServer.shutdownServer(serverInstance).then(async () => {
      await contractServer.stores.reset();
      done();
    });
  });

  it("Test model", function(done) {
    (async function() {
      return done();
    })().catch(err => {
      return done(err);
    });
  });

  it("Test stores", function(done) {
    (async function() {
      return done();
    })().catch(err => {
      return done(err);
    });
  });
});
