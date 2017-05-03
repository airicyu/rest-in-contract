'use strict';

class Request {
    constructor(props) {
        this.method = props.method || 'GET';
        this.urlPath = props.urlPath || '/';
        this.queryParameters = props.queryParameters || [];
        this.body = props.body || '';
        this.headers = props.headers || {};
    }
}

module.exports = Request;