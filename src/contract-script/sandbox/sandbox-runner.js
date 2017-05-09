'use strict';

const { NodeVM } = require('vm2');

const dsl = require('rest-in-contract-dsl');
const builtinFunctions = dsl.functions;

const runScript = function (script, extensions) {
    let mockDsl = {
        baseTypes: dsl.baseTypes,
        functions: Object.assign({}, builtinFunctions, extensions),
        utils: dsl.utils
    };
    
    let builtinFunctionKeys = [];
    for (let key in builtinFunctions){
        builtinFunctionKeys.push(key);
    }
    for (let key in extensions){
        if (!builtinFunctionKeys.includes(key)){
            builtinFunctionKeys.push(key);
        }
    }
    let preloadFunctionScript = `'use strict'\n`;
    preloadFunctionScript += `var { ${builtinFunctionKeys.join(', ')} } = dslFunctions;\n`;
    
    let vm = new NodeVM({
        console: 'inherit',
        sandbox: {},
        require: {
            external: false,
            builtin: [],
            root: "./",
            mock: {
            }
        },
        wrapper: 'commonjs'
    });
    vm.freeze(mockDsl.functions, 'dslFunctions');

    try{
        let proxyObject = vm.run(preloadFunctionScript + script);
        return proxyObject;
    } catch (e){
        console.error('sandbox-runner runtime error', e, e.stack);
        throw(e);
    }
}

module.exports.runScript = runScript;