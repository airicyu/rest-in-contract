'use strict';

const { NodeVM } = require('vm2');

const middleware = require('./../middlewares/middlewares');
const builtinMiddlewares = middleware.builtin;

const runScript = function (script, extensions) {
    let sandbox = {};
    Object.assign(sandbox, builtinMiddlewares, extensions);

    let vm = new NodeVM({
        console: 'inherit',
        sandbox: sandbox,
        require: {
            external: false,
            builtin: [],
            root: "./",
            mock: {}
        },
        wrapper: 'commonjs'
    });

    let proxyObject = vm.run(script);
    return proxyObject;
}

module.exports.runScript = runScript;