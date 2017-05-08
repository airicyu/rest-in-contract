'use strict';

const hal = require('hal');
const moduleAPIVersion = "1";

class Version {
    constructor(props = {}) {
        let self = this;

        this.parent = null;
        this.v = null;
        this.path = null;
        this.contracts = [];

        if (props.parent && typeof props.parent === 'string') {
            self.parent = props.parent;
        }
        if (props.v && typeof props.v === 'string') {
            self.v = props.v;
        }
        if (props.path && typeof props.path === 'string') {
            self.path = props.path;
        }
        if (props.contracts && Array.isArray(props.contracts)) {
            props.contracts.forEach((contractId) => {
                self.contracts.push(contractId);
            });
        }

    }

    static newFromAttributes(attributes) {
        let props = {
            v: attributes.v,
            path: attributes.path,
            contracts: attributes.contracts
        }
        return new Version(props);
    }

    toHal() {
        let version = this;
        let appId = version.parent;

        let versionHal = new hal.Resource({
            v: version.v,
            path: version.path,
            contracts: version.contracts
        }, `/api/v${moduleAPIVersion}/apps/${appId}/versions/${version.v}`);
        versionHal.link('parent', `/api/v${moduleAPIVersion}/apps/${appId}`);
        versionHal.link('contracts', `/api/v${moduleAPIVersion}/apps/${appId}/versions/${version.v}/contracts`);
        return versionHal;
    }
}

module.exports = Version;