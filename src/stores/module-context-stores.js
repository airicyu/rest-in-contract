'use strict';

const { Result } = require('stateful-result').models;

var wirestubStore = new Map();
var stubServerStore = new Map();

var moduleContextStore = {
    stores: {
        wirestubs: {
            create: async(appId, wirestub) => {
                let existingWirestub = wirestubStore.get(appId);
                if (!existingWirestub) {
                    wirestubStore.set(appId, wirestub);
                    return Result.newSuccess({ code: 201 });
                } else {
                    return Result.newFail({ code: 409 });
                }
            },
            get: async(appId) => {
                if (appId) {
                    let wirestub = wirestubStore.get(appId);
                    if (wirestub) {
                        return Result.newSuccess({ code: 200, data: wirestub });
                    } else {
                        return Result.newFail({ code: 404 });
                    }
                } else {
                    let appIds = Array.from(wirestubStore.keys());
                    return Result.newSuccess({ code: 200, data: appIds });
                }
            },
            update: async(appId, wirestub) => {
                let existingWirestub = wirestubStore.get(appId);
                if (existingWirestub) {
                    wirestubStore.set(appId, wirestub);
                    return Result.newSuccess({ code: 204 });
                } else {
                    return Result.newFail({ code: 404 });
                }
            },
            delete: async(appId) => {
                let wirestub = wirestubStore.get(appId);
                if (wirestub) {
                    wirestubStore.delete(appId);
                    return Result.newSuccess({ code: 204 });
                } else {
                    return Result.newFail({ code: 404 });
                }
            },
            reset: async() => {
                wirestubStore = new Map();
                return Result.newSuccess({ code: 204 })
            }
        },
        stubServers: {
            set: async(appId, server) => {
                stubServerStore.set(appId, server)
                return Result.newSuccess({ code: 204 });
            },
            get: async(appId) => {
                let server = stubServerStore.get(appId);
                if (server) {
                    return Result.newSuccess({ code: 200, data: server });
                } else {
                    return Result.newFail({ code: 404 });
                }
            },
            delete: async(appId) => {
                let server = stubServerStore.get(appId);
                if (server) {
                    stubServerStore.delete(appId);
                    return Result.newSuccess({ code: 204 });
                } else {
                    return Result.newFail({ code: 404 });
                }
            },
            reset: async() => {
                stubServerStore = new Map();
                return Result.newSuccess({ code: 204 })
            }
        }
    }
}

module.exports = moduleContextStore;