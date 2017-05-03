'use strict';
const { Result } = require('stateful-result').models;

const appsStore = new Map();
const contractsStore = new Map();

var memoryResourceStore = {
    stores: {
        apps: {
            create: async(app) => {
                let existingApp = appsStore.get(app.id);
                if (!existingApp) {
                    appsStore.set(app.id, app);
                    return Result.newSuccess({ code: 201, data: app.id });
                } else {
                    return Result.newFail({ code: 409 });
                }
            },
            get: async(appId) => {
                if (appId) {
                    let app = appsStore.get(appId);
                    if (app) {
                        return Result.newSuccess({ code: 200, data: app });
                    } else {
                        return Result.newFail({ code: 404 });
                    }
                } else {
                    let appIds = Array.from(appsStore.keys());
                    return Result.newSuccess({ code: 200, data: appIds });
                }
            },
            update: async(app) => {
                let existingApp = appsStore.get(app.id);
                if (existingApp) {
                    appsStore.set(app.id, app);
                    return Result.newSuccess({ code: 204 });
                } else {
                    return Result.newFail({ code: 404 });
                }
            },
            delete: async(appId) => {
                let app = appsStore.get(appId);
                if (app) {
                    appsStore.delete(appId);
                    return Result.newSuccess({ code: 204 });
                } else {
                    return Result.newFail({ code: 404 });
                }
            }
        },
        contracts: {
            create: async(contract) => {
                let existingContract = contractsStore.get(contract.id);
                if (!existingContract) {
                    contractsStore.set(contract.id, contract);
                    return Result.newSuccess({ code: 201, data: contract.id });
                } else {
                    return Result.newFail({ code: 409 });
                }
            },
            get: async(contractId) => {
                if (contractId) {
                    let contract = contractsStore.get(contractId);
                    if (contract) {
                        return Result.newSuccess({ code: 200, data: contract });
                    } else {
                        return Result.newFail({ code: 404 });
                    }
                } else {
                    let contractIds = Array.from(contractsStore.keys());
                    return Result.newSuccess({ code: 200, data: contractIds });
                }
            },
            update: async(contract) => {
                let existingContract = contractsStore.get(contract.id);
                if (existingContract) {
                    contractsStore.set(contract.id, contract);
                    return Result.newSuccess({ code: 204 });
                } else {
                    return Result.newFail({ code: 404 });
                }
            },
            delete: async(contractId) => {
                let contract = contractsStore.get(contractId);
                if (contract) {
                    contractsStore.delete(contractId);
                    return Result.newSuccess({ code: 204 });
                } else {
                    return Result.newFail({ code: 404 });
                }
            }
        }
    }
}

module.exports = memoryResourceStore;