'use strict'

var express = require('express');
var { Contract } = require('./../models/models');
var { contractServices } = require('./../services/services');

var router = express.Router({ mergeParams: true });

router.param('contractId', async(req, res, next, contractId) => {
    let [error, contract] = (await contractServices.get(contractId)).get();
    if (error) {
        return res.status(error.code).send(error.message);
    } else {
        req.params.contract = contract;
        return next();
    }
});

router.post('/', async(req, res) => {
    let contractScript;
    let contract;
    if (req.headers['content-type'] === 'application/json') {
        contractScript = req.params.contractScript
    } else if (req.headers['content-type'] === 'application/vnd.js.contract') {
        contractScript = req.body;
    }
    contract = Contract.newFromScript(contractScript);

    let [error, contractId, code, result] = (await contractServices.create(contract)).get();
    if (contractId) {
        res.set('location', `/api/v1/contracts/${contractId}`);
        res.status(201).send('Contract created');
    } else {
        res.status(code).send(result.message);
    }
});

router.get('/', async(req, res) => {
    let [error, contractIds, code] = (await contractServices.get()).get();
    res.send(contractIds);
});

router.get('/:contractId', async(req, res) => {
    if (req.params.contract) {
        let contract = req.params.contract;

        if (req.headers['accept'] === 'application/json') {
            res.set('content-type', 'application/json')
            return res.send(contract.toHal());
        } else if (req.headers['accept'] === 'application/vnd.js.contract') {
            res.set('content-type', 'application/vnd.js.contract')
            return res.send(contract.toContractScript());
        }

        res.set('content-type', 'application/vnd.js.contract')
        return res.send(contract.toContractScript());

    } else {
        return res.status(404).send('Contract not found');
    }
});

router.delete('/:contractId', async(req, res) => {
    let contractId = req.params.contractId;
    let [error, data, code, result] = (await contractServices.delete(contractId)).get();

    if (!error) {
        res.status(204).send('No content');
    } else {
        res.status(error.code).send(error.message);
    }
});

module.exports = router