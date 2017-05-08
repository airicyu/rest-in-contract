'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const api = require('./api');
const appRouter = require('./controllers/app-router');
const contractRouter = require('./controllers/contract-router');

const moduleAPIVersion = "1";

var initRestServer = function(options){
    var port = options.port || 8000;

    var app = express();
    app.use(bodyParser.json({
        limit: '5mb'
    }));
    app.use(bodyParser.urlencoded({
        limit: '5mb',
        extended: true
    }));
    app.use(bodyParser.raw({
        type: 'application/vnd.js.contract',
        limit: '5mb'
    }));

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

    console.log(`Contract Server started on port ${port}`);
    app.listen(port);
}

module.exports = {
    initRestServer,
    api
};