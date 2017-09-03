'use strict'

var express = require('express');
var { Version } = require('./../models/models');
var { versionServices } = require('./../services/services');

var router = express.Router({ mergeParams: true });

router.param('versionNo', async(req, res, next, versionNo) => {
    let appId = req.params.appId;
    let [error, version] = (await versionServices.get(appId, versionNo)).get();
    if (error) {
        return res.status(error.code).send(error.message);
    } else {
        req.params.version = version;
        return next();
    }
});

router.post('/', async(req, res) => {
    let version = Version.newFromAttributes(req.body);
    let error, appId, versionNo, code, result
    appId = req.params.appId;

    [error, versionNo, code, result] = (await versionServices.create(appId, version)).get();
    if (versionNo) {
        res.set('location', `/api/v1/apps/${appId}/versions/${versionNo}`);
        res.status(201).send('Version created');
    } else {
        res.status(code).send(result.message);
    }
});

router.put('/:versionNo', async(req, res) => {
    var versionNo = req.params.versionNo
    var version = Version.newFromAttributes(req.body);
    var error, appId, data, code, result
    appId = req.params.appId;

    var [error, originalVersion] = (await versionServices.get(appId, versionNo)).get();
    if (originalVersion){
        version.contracts = originalVersion.contracts;
    }

    [error, data, code] = (await versionServices.update(appId, version)).get();
    if (!error) {
        res.status(204).send('No content');
    } else {
        res.status(code).send(result.message);
    }
});

router.delete('/:versionNo', async(req, res) => {
    let appId = req.params.appId;
    let versionNo = req.params.versionNo
    let [error, data, code, result] = (await versionServices.delete(appId, versionNo)).get();
    if (!error) {
        res.status(204).send('No content');
    } else {
        res.status(code).send(result.message);
    }
});

router.get('/', async(req, res) => {
    let appId = req.params.appId;
    let [error, versionNos, code] = (await versionServices.get(appId)).get();
    res.send(versionNos);
});

router.get('/:versionNo', async(req, res) => {
    if (req.params.app) {
        let version = req.params.version;
        let hal = version.toHal();
        res.set('content-type', 'application/json+hal')
        res.send(hal);
    } else {
        res.status(404).send('App not found');
    }
});

module.exports = router