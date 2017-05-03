'use strict';

const uuidV4 = require('uuid/v4');
const {
    App
} = require('./../models/models');

const stores = require('./../stores/stores');

function appsStore(){
    return stores.getStore('apps');
}

const appServices = {
    create: async(app) => {
        app.id = app.id || uuidV4();
        return await appsStore().create(app);
    },

    get: async(id) => {
        return await appsStore().get(id);
    },

    update: async(app) => {
        return await appsStore().update(app);
    },

    delete: async(app) => {
        return await appsStore().delete(app);
    }
}

module.exports = appServices;