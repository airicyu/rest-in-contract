'use strict';

const uuidV4 = require('uuid/v4');
const Version = require('./version');
const hal = require('hal');
const moduleAPIVersion = require('./../../package.json')['api-version'];

class App {
    constructor(props = {}) {
        let self = this;
        this.id = null;
        this.name = null;
        this.servers = [];
        this.basePath = null;
        this.versions = [];

        if (props.id && typeof props.id === 'string') {
            self.id = props.id;
        }
        if (props.name && typeof props.name === 'string') {
            self.name = props.name;
        }
        if (props.servers && Array.isArray(props.servers)) {
            props.servers.forEach((server) => {
                typeof server === 'string' && self.servers.push(server);
            });
        }
        if (props.basePath && typeof props.basePath === 'string') {
            self.basePath = props.basePath;
        }
        if (props.versions && Array.isArray(props.versions)) {
            props.versions.forEach((versionProps) => {
                let version = new Version(versionProps)
                version.parent = self.id;
                self.versions.push(version);
            });
        }
    }

    static newFromAttributes(attributes) {
        let props = {
            id: attributes.id,
            name: attributes.name,
            servers: attributes.servers,
            basePath: attributes.basePath
        }
        return new App(props);
    }

    toHal() {
        let app = this;
        let appHal = new hal.Resource({
            id: app.id,
            name: app.name,
            servers: app.servers,
            basePath: app.basePath,
            versionNumbers: app.versions.map((_v) => _v.v)
        }, `/api/v${moduleAPIVersion}/apps/${app.id}`);
        appHal.link('versions', `/api/v${moduleAPIVersion}/apps/${app.id}/versions`);

        return appHal;
    }

}

module.exports = App;