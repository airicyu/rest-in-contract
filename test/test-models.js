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

describe("Test start server", function() {
  this.timeout(2000);

  var serverInstance = null;
  
  it("Test App", function(done) {
    //test constrcut App model
    let app = new App({
      id: 'a',
      name: 'b',
      servers: ['http://localhost'],
      basePath: '/base',
      versions: [{
        v: '0.0.1',
        path: '/',
        contracts: []
      }]
    });
    expect(app.id).to.equal('a');
    expect(app.name).to.equal('b');
    expect(app.servers).to.eqls(['http://localhost']);
    expect(app.basePath).to.equal('/base');
    expect(app.versions).to.eqls([{
      parent: 'a',
      v: '0.0.1',
      path: '/',
      contracts: []
    }]);

    //test constrcut App model with empty props
    app = new App();
    expect(app.id).to.equal(null);
    expect(app.name).to.equal(null);
    expect(app.servers).to.eqls([]);
    expect(app.basePath).to.equal(null);
    expect(app.versions).to.eqls([]);

    done();
  });

  it("Test Version", function(done) {
    //test constrcut Version model
    let version = new Version({
        parent: 'a',
        v: '0.0.1',
        path: '/',
        contracts: []
      });
    expect(version).to.eqls({
      parent: 'a',
      v: '0.0.1',
      path: '/',
      contracts: []
    });

    //test constrcut Version model with empty props
    version = new Version();
    expect(version).to.eqls({
      parent: null,
      v: null,
      path: null,
      contracts: []
    });

    done();
  });

  //test constrcut Contract model
  it("Test Contract", function(done) {
    let contract = new Contract({
        id: 'a',
        name: 'b',
        request: {},
        response: {},
        rawScript: 'module.exports = {}'
      });
    expect(contract).to.eqls({
      id: 'a',
      name: 'b',
      request: {
        "body": "",
        "headers": {},
        "method": "GET",
        "queryParameters": [],
        "urlPath": "/"
      },
      response: {
        "body": "",
        "headers": {},
        "status": 200
      },
      rawScript: 'module.exports = {}'
    });

    //test constrcut Contract model with empty props
    contract = new Contract();
    expect(contract).to.eqls({
      id: null,
      name: '',
      request: {
        "body": "",
        "headers": {},
        "method": "GET",
        "queryParameters": [],
        "urlPath": "/"
      },
      response: {
        "body": "",
        "headers": {},
        "status": 200
      },
      rawScript: ''
    });

    //test constrcut Contract model by newFromScript
    contract = Contract.newFromScript('module.exports = {};');
    expect(contract).to.eqls({
      id: null,
      name: '',
      request: {
        "body": "",
        "headers": {},
        "method": "GET",
        "queryParameters": [],
        "urlPath": "/"
      },
      response: {
        "body": "",
        "headers": {},
        "status": 200
      },
      rawScript: 'module.exports = {};'
    });

    //test constrcut Contract model by newFromScript
    contract = Contract.newFromScript('module.exports = null;');
    expect(contract).to.be.null;

    //test constrcut Contract model by newFromScript with error
    contract = Contract.newFromScript('error');
    expect(contract).to.be.null;

    done();
  });

  it("Test Wirestub", function(done) {
    //test constrcut Wirestub model
    let wirestub = new Wirestub({
        port: 8001
      });
    expect(wirestub).to.eqls({
      port: 8001
    });

    //test constrcut Wirestub model with empty props
    wirestub = new Wirestub();
    expect(wirestub).to.eqls({port: null});

    done();
  });

  it("Test Wiretest", function(done) {
    //test constrcut Wiretest model
    let wiretest = new Wiretest({
        server: 'http://localhost'
      });
    expect(wiretest).to.eqls({
      server: 'http://localhost'
    });

    //test constrcut Wirestub model with empty props
    wiretest = new Wiretest();
    expect(wiretest).to.eqls({server: null});

    done();
  });
  
});
