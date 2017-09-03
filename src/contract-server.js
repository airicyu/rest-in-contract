'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const models = require('./models/models');
const api = require('./api');
const appRouter = require('./controllers/app-router');
const contractRouter = require('./controllers/contract-router');
const httpShutdown = require('http-shutdown');
const stores = require('./stores/stores');

const moduleAPIVersion = require('./../package.json')['api-version'];

var initServer = function(options){
    var port = options.port || 8000;
    var app = options.app || express();

    var jsonParser = bodyParser.json({
        limit: '10mb'
    });

    var urlencodedParser = bodyParser.urlencoded({
        limit: '10mb',
        extended: true
    });

    var jsContractParser = bodyParser.text({
        type: 'application/vnd.js.contract',
        limit: '10mb'
    });

    app.use(function(req, res, next){
        return jsonParser(req, res, (error)=>{
            if (error) {
                console.error(error);
                res.status(400).send('Bad Request');
            } else {
                next();
            }
        });
    });

    app.use(function(req, res, next){
        return urlencodedParser(req, res, (error)=>{
            if (error) {
                console.error(error);
                res.status(400).send('Bad Request');
            } else {
                next();
            }
        });
    });

    app.use(function(req, res, next){
        return jsContractParser(req, res, (error)=>{
            if (error) {
                console.error(error);
                res.status(400).send('Bad Request');
            } else {
                next();
            }
        });
    });

    app.use(`/api/v${moduleAPIVersion}/apps`, appRouter);
    app.use(`/api/v${moduleAPIVersion}/contracts`, contractRouter);

    app.post(`/api/v${moduleAPIVersion}/importAppsFiles`, async function(req, res){
        let appFolder = req.body.appFolder;
        try{
            await api.importAppsFiles(appFolder);
            res.status(201).send('importAppsFiles done');
        } catch(e){
            console.error(e, e.stack);
            res.status(500).send(e.message);
        }
        
    });

    app.use(`/api/v${moduleAPIVersion}/apps`, appRouter);

    let apiSpec = require(`./api-spec/v${moduleAPIVersion}/swagger.json`);
    apiSpec.host = `localhost:${port}`;
    
    app.get(`/openapi/v${moduleAPIVersion}/api.json`, (req, res)=>{
        res.send(apiSpec);
    });

    app.get('/api/v', function(req, res){
        res.send(moduleAPIVersion);
    });

    app.get('/api', function(req, res){
        res.send('OK');
    });

    app.use(express.static(path.join(__dirname, 'public')));

    //console.log(`Contract Server started on port ${port}`);
    let serverInstance = app.listen(port);
    serverInstance = httpShutdown(serverInstance);
    return serverInstance;
}

var shutdownServer = async function(serverInstance){
    return new Promise((resolve, reject) => {
        serverInstance.forceShutdown(async() => {
            resolve();
        });
    });
}

module.exports = {
    initServer,
    shutdownServer,
    api,
    models,
    stores
};