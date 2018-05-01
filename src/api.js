const { appServices, versionServices, contractServices, wirestubServices, wiretestServices } = require('./services/services');
const importHelper = require('./helpers/import-helper');

const api = {
    app: {
        create: async(app) => {
            return appServices.create(app);
        },
        get: async(appId) => {
            return appServices.get(appId);
        },
        update: async(app) => {
            return appServices.update(app);
        },
        delete: async(appId) => {
            return appServices.delete(appId);
        },
        wirestub: {
            create: async(appId, wirestub) => {
                return wirestubServices.create(appId, wirestub);
            },
            get: async(appId) => {
                return wirestubServices.get(appId);
            },
            delete: async(appId) => {
                return wirestubServices.delete(appId);
            },
        },
        wiretest: {
            post: async(appId, wiretest) => {
                return wiretestServices.appWiretest(appId, wiretest);
            }
        },
        version: {
            create: async(appId, version) => {
                return versionServices.create(appId, version);
            },
            get: async(appId, versionId) => {
                return versionServices.get(appId, versionId);
            },
            update: async(appId, version) => {
                return versionServices.update(appId, version);
            },
            delete: async(appId, versionId) => {
                return versionServices.delete(appId, versionId);
            },
        },
    },
    contract: {
        create: async(contract) => {
            return contractServices.create(contract);
        },
        get: async(contractId) => {
            return contractServices.get(contractId);
        },
        update: async(contract) => {
            return contractServices.update(contract);
        },
        delete: async(contractId) => {
            return contractServices.delete(contractId);
        },
    },
    importAppsFiles: importHelper.importAppsFiles
};

for(let key in api){
    module.exports[key] = api[key];
}