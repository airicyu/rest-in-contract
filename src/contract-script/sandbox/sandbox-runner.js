'use strict';

const { NodeVM } = require('vm2');

const dsl = require('./../dsl/dsl');
const builtinFunctions = dsl.functions;

const runScript = function (script, extensions) {
    let sandbox = {};
    Object.assign(sandbox, builtinFunctions, extensions);

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

    try{
        let proxyObject = vm.run(script);
        return proxyObject;
    } catch (e){
        console.error('sandbox-runner runtime error', e, e.stack);
        throw(e);
    }
}

module.exports.runScript = runScript;