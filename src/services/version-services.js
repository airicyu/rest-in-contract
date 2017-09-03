'use strict';

const uuidV4 = require('uuid/v4');
const { Result } = require('stateful-result').models;
const {
    App,
    Version
} = require('./../models/models');
const stores = require('./../stores/stores');

function appsStore() {
    return stores.getStore('apps');
}

const versionServices = {
    create: async(appId, version) => {
        if (!version.v) {
            return Result.newFail({
                code: 400
            });
        }

        let [error, app] = (await appsStore().get(appId)).getOrThrow();
        if (!app.versions.map((_v) => _v.v).includes(version.v)) {
            version.parent = appId;
            app.versions.push(version);
            let [error] = (await appsStore().update(app)).getOrThrow();
            return Result.newSuccess({
                code: 201,
                data: version.v
            });
        }
        return Result.newFail({
            code: 409
        });
    },

    get: async(appId, v) => {
        let [error, app] = (await appsStore().get(appId)).getOrThrow();
        if (!appId){
            return Result.newFail({
                code: 404
            });
        } else if (v) {
            let version = app.versions.find((version) => version.v === v);
            if (version) {
                return Result.newSuccess({
                    code: 200,
                    data: version
                });
            } else {
                return Result.newFail({
                    code: 404
                });
            }
        } else {
            return Result.newSuccess({
                code: 200,
                data: app.versions.map(version => version.v)
            });
        }
    },

    update: async(appId, version) => {
        let [error, app] = (await appsStore().get(appId)).getOrThrow();
        if (app.versions.map(_v => _v.v).includes(version.v)) {
            app.versions = app.versions.map((_version) => {
                return (_version.v === version.v) ? version : _version;
            });

            let [error] = (await appsStore().update(app)).getOrThrow();
            return Result.newSuccess({
                code: 204
            });
        }
        return Result.newFail({
            code: 404
        });
    },

    delete: async(appId, v) => {
        let [error, app] = (await appsStore().get(appId)).getOrThrow();
        let version = app.versions.find((version) => version.v === v);
        if (version) {
            app.versions = app.versions.filter((_version) => {
                return (_version.v !== version.v);
            });
            let [error] = (await appsStore().update(app)).getOrThrow();
            return Result.newSuccess({
                code: 204
            });
        } else {
            return Result.newFail({
                code: 404
            });
        }
    }
}

module.exports = versionServices;