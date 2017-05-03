'use strict';

const coreType = require('./core-types');
const builtin = require('./builtin-middlewares');

Object.assign(module.exports, {
    types: coreType.types,
    builtin: builtin.middlewares,
    utils: coreType.utils
});