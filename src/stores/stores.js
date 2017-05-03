'use strict';
const moduleContextStores = require('./module-context-stores');
const memoryResourceStores = require('./memory-resource-stores');

class Store {
    constructor() {
        this.storesMap = new Map();
    }

    getStore(key) {
        return this.storesMap.get(key);
    }

    setStore(key, store) {
        this.storesMap.set(key, store);
    }

    mergeStores(stores) {
        for (let key in stores) {
            this.setStore(key, stores[key]);
        }
    }
}

const stores = new Store();
stores.mergeStores(moduleContextStores.stores);
stores.mergeStores(memoryResourceStores.stores);

module.exports = stores;