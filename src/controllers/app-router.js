'use strict'

var express = require('express');
var { App, Wiretest } = require('./../models/models');
var { appServices, wiretestService } = require('./../services/services');

var router = express.Router({ mergeParams: true });
var versionRouter = require('./version-router');
var wirestubRouter = require('./wirestub-router');

router.param('appId', async(req, res, next, appId) => {
    let [error, app] = (await appServices.get(appId)).get();
    if (error) {
        return res.status(error.code).send(error.message);
    } else {
        req.params.app = app;
        return next();
    }
});

router.post('/', async(req, res) => {
    let app = App.newFromAttributes(req.body);
    let [error, appId, code, result] = (await appServices.create(app)).get();
    if (appId) {
        res.set('location', `/api/v1/apps/${appId}`);
        res.status(201).send('App created');
    } else {
        res.status(code).send(result.message);
    }
});

router.put('/:appId', async(req, res) => {
    let appId = req.params.appId;
    let app = App.newFromAttributes(req.body);
    app.id = appId;
    let [error, data, code, result] = (await appServices.update(app)).get();
    if (!error) {
        res.status(204).send('No content');
    } else {
        res.status(code).send(result.message);
    }
});

router.delete('/:appId', async(req, res) => {
    let appId = req.params.appId;
    if (req.params.app) {
        let app = req.params.app;
        let [error, data, code, result] = (await appServices.delete(appId)).get();
        if (!error) {
            res.status(204).send('No content');
        } else {
            res.status(code).send(result.message);
        }
    } else {
        res.status(404).send('App not found');
    }
});

router.get('/', async(req, res) => {
    let [error, appIds, code] = (await appServices.get()).get();
    res.send(appIds);
});


router.get('/:appId', async(req, res) => {
    if (req.params.app) {
        let app = req.params.app;
        let hal = app.toHal();
        res.set('content-type', 'application/json+hal')
        res.send(hal);
    } else {
        res.status(404).send('App not found');
    }
});

router.post('/:appId/wiretests', async(req, res) => {
    let wiretest = new Wiretest(req.body);
    let appId = req.params.appId;
    let records = await wiretestService.appWiretest(appId, wiretest);

    res.send(records);
});

router.use('/:appId/versions', versionRouter);
router.use('/:appId/wirestubs', wirestubRouter);

module.exports = router