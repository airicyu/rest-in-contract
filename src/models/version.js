'use strict';

var hal = require('hal');

class Version {
    constructor(props) {
        let self = this;
        Object.assign(self, {
            parent: null,
            v: null,
            path: null,
            contracts: []
        });

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
        }, `/api/v1/apps/${appId}/versions/${version.v}`);
        versionHal.link('parent', `/api/v1/apps/${appId}`);
        versionHal.link('contracts', `/api/v1/apps/${appId}/versions/${version.v}/contracts`);
        return versionHal;
    }
}

module.exports = Version;