'use strict';

class Response {
    constructor(props = {}) {
        this.status = props.status || 200;
        this.body = props.body || '';
        this.headers = props.headers || {};
    }
}

module.exports = Response;