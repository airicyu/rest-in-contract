const Request = require('./request.js');
const Response = require('./response.js');
const uuid = require('uuid/v4');
const dsl = require('rest-in-contract-dsl');

const { Middleware } = dsl.baseTypes;
const sandboxRunner = require('./../contract-script/sandbox/sandbox-runner');
const beautify = require('js-beautify').js_beautify;
var hal = require('hal');

class Contract {
    constructor(props = {}) {
        this.id = null;
        this.name = '';
        this.request = null;
        this.response = null;
        this.rawScript = '';

        if (props.id && typeof props.id === 'string'){
            this.id = props.id;
        }
        if (props.name && typeof props.name === 'string'){
            this.name = props.name;
        } else {
            this.name = this.id || '';
        }

        this.request = new Request(props.request || {});
        this.response = new Response(props.response || {});
        if (props.rawScript && typeof props.rawScript === 'string'){
            this.rawScript = props.rawScript;
        }
    }

    static newFromScript(contractScript) {
        let contract = null;
        try{
            let scriptOutputObject = sandboxRunner.runScript(contractScript);
            
            if (scriptOutputObject) {
                contract = new Contract(scriptOutputObject, {});
                contract.rawScript = beautify(contractScript, { indent_size: 2 });
            }
        } catch(e){
            //console.error(e);
        }
        return contract;
    }

    toHal() {
        let contract = this;

        let contractHal = new hal.Resource({
            id: contract.id,
            name: contract.name,
            contractScript: this.rawScript//contract.toContractCompatScript()
        }, `/api/v1/contracts/${contract.id}`);
        return contractHal;
    }

}

module.exports = Contract;