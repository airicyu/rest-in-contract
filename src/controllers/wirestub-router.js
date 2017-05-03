'use strict'

var express = require('express');
var { Wirestub } = require('./../models/models');
var { wirestubServices } = require('./../services/services');

var router = express.Router({ mergeParams: true });

router.post('/', async(req, res, next) => {
    let appId = req.params.appId;
    let wirestub = new Wirestub(req.body);
    let [error, data, code] = (await wirestubServices.create(appId, wirestub)).get();
    if (!error) {
        res.set('location', `http://localhost:${wirestub.port}`);
        return res.status(201).send('Wirestub created');
    } else {
        return res.status(code).send(error.message);
    }
});

router.get('/', async(req, res) => {
    let appId = req.params.appId;
    let [error, wirestub, code] = (await wirestubServices.get(appId)).get();
    if (!error) {
        return res.status(200).send(wirestub);
    } else {
        return res.status(code).send(error.message);
    }
});

router.delete('/', async(req, res) => {
    let appId = req.params.appId;
    let [error, data, code] = (await wirestubServices.delete(appId)).get();
    if (!error) {
        return res.status(204).send('Wirestub deleted');
    } else {
        return res.status(code).send(error.message);
    }
});

module.exports = router