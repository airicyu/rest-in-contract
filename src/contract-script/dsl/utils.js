'use strict';

const recurrsiveToString = function (obj) {
    var { Middleware, Comparable } = require('./base-types').types;
    if (obj instanceof Middleware) {
        return obj.toJsonString();
    } else if (obj.toJsonString) {
        return obj.toJsonString();
    }

    let out = '';
    if (typeof obj === 'object' && !Array.isArray(obj)) {
        out += '{ ';
        let currObjStr = '';
        for (let key in obj) {
            if (typeof obj[key] === 'function') {
                continue;
            }
            currObjStr += JSON.stringify(key) + ": ";
            currObjStr += recurrsiveToString(obj[key]);
            currObjStr += ", ";
        }
        if (currObjStr.length > 2) {
            currObjStr = currObjStr.substr(0, currObjStr.length - 2);
        }
        out += currObjStr + ' }';
    } else {
        out = JSON.stringify(obj);
    }
    return out;
}

module.exports.recurrsiveToString = recurrsiveToString;