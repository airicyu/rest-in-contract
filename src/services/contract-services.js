'use strict';

const uuidV4 = require('uuid/v4');
const {
    Contract
} = require('./../models/models');

const stores = require('./../stores/stores');

function contractsStore() {
    return stores.getStore('contracts');
}

const contractServices = {
    create: async (contract) => {
        contract.id = contract.id || uuidV4();
        return await contractsStore().create(contract);
    },

    get: async (contractId) => {
        return await contractsStore().get(contractId);
    },

    update: async (contract) => {
        return await contractsStore().update(contract);
    },

    delete: async (contract) => {
        return await contractsStore().delete(contract);
    }

}

module.exports = contractServices;