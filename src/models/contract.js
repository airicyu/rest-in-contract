const Request = require('./request.js');
const Response = require('./response.js');
const uuid = require('uuid/v4');
const dsl = require('rest-in-contract-dsl');

const { recurrsiveToString } = dsl.utils;
const { Middleware } = dsl.baseTypes;
const { recurrsiveEvaluate, recurrsiveCompare, recurrsiveMock, value, stubValue, testValue } = dsl.functions;
const sandboxRunner = require('./../contract-script/sandbox/sandbox-runner');
const beautify = require('js-beautify').js_beautify;
var hal = require('hal');

class Contract {
    constructor(props = {}) {
        this.id = props.id;
        this.name = props.name || this.id;
        this.request = new Request(props.request || {});
        this.response = new Response(props.response || {});
        this.rawScript = props.rawScript;
    }

    static newFromScript(contractScript) {
        let scriptOutputObject = sandboxRunner.runScript(contractScript);
        if (scriptOutputObject) {
            let contract = new Contract(scriptOutputObject, {});
            contract.rawScript = beautify(contractScript, { indent_size: 2 });
            return contract;
        }
        return null;
    }

    toHal() {
        let contract = this;

        let contractHal = new hal.Resource({
            id: contract.id,
            name: contract.name,
            contractsScript: this.rawScript//contract.toContractCompatScript()
        }, `/api/v1/contracts/${contract.id}`);
        return contractHal;
    }

    /*
    toStubContract() {
        let contractScript = this.rawScript;
        //let contractScript = "module.exports = " + recurrsiveToString(this);
        let stubContract = new Contract(sandboxRunner.runScript(contractScript, {
            value: stubValue
        }));
        return stubContract;
    }*/
/*
    toTestingContractScript() {
        let contractScript = "module.exports = " + recurrsiveToString(this);
        let testContract = new Contract(sandboxRunner.runScript(contractScript, {
            value: testValue
        }));
        let testContractScript = "module.exports = " + recurrsiveToString(testContract);
        testContractScript = beautify(testContractScript, { indent_size: 2 })
        return testContractScript;
    }*/

    
    toTestingContract() {
        //let contractScript = "module.exports = " + recurrsiveToString(this);
        let contractScript = this.rawScript;
        let scriptOutputObject = sandboxRunner.runScript(contractScript);
        
        let recurrsiveValueToTestValue = function (obj){
            let returnObj = {};

            let currObject = obj;
            if (typeof currObject === 'object') {
                if (Array.isArray(currObject)){
                    returnObj = [];
                } else {
                    returnObj = {};
                }

                if (Middleware.isMiddleware(currObject)) {
                    if (obj.type === 'ConsumerProducerValue'){
                        returnObj = obj.evaluateTestValue();
                    } else {
                        returnObj = currObject;
                    }
                } else {
                    for (let key in currObject) {
                        returnObj[key] = recurrsiveValueToTestValue(currObject[key]);
                    }
                }
            } else {
                returnObj = currObject;
            }
        }

        scriptOutputObject = recurrsiveValueToTestValue(scriptOutputObject);
        scriptOutputObject.rawScript = contractScript;
        let testContract = new Contract(scriptOutputObject);

        return testContract;
    }

    isHandle(basePath, req) {
        let self = this;
        let isMatch = true;

        let evaluateContext = {
            req: {
                method: req.method,
                urlPath: req.path,
                query: req.query,
                body: req.body,
                headers: req.headers
            },
            isStub: true
        }

        if (self.request.method) {
            isMatch = isMatch && req.method === self.request.method;
        }
        if (self.request.urlPath) {
            let incomeReqPath = req.originalUrl.indexOf(basePath) === 0 ? req.path.replace(basePath, '') : req.path;
            incomeReqPath.indexOf('/') !== 0 && (incomeReqPath = '/' + incomeReqPath);
            let urlPath = self.request.urlPath;
            urlPath = recurrsiveEvaluate(urlPath).evaluate(evaluateContext);
            isMatch = isMatch && recurrsiveCompare(urlPath).compareFunc(incomeReqPath);

        }
        if (self.request.queryParameters) {
            for (let i = 0; i < self.request.queryParameters.length; i++) {
                let queryParam = self.request.queryParameters[i];
                let paramName = queryParam.name;
                paramName = recurrsiveEvaluate(paramName).evaluate(evaluateContext);

                let paramValue = queryParam.value;
                paramValue = recurrsiveEvaluate(paramValue).evaluate(evaluateContext);

                isMatch = isMatch && recurrsiveCompare(paramValue).compareFunc(req.query[paramName]);
            }
        }

        if (self.request.headers) {
            for (let headerKey in self.request.headers) {
                let headerValue = self.request.headers[headerKey];

                headerValue = recurrsiveEvaluate(headerValue).evaluate(evaluateContext);
                isMatch = isMatch && recurrsiveCompare(headerValue).compareFunc(req.headers[headerKey.toLowerCase()]);
            }
        }

        if (self.request.body) {
            let body = self.request.body;
            body = recurrsiveEvaluate(body).evaluate(evaluateContext);
            isMatch = isMatch && recurrsiveCompare(body).compareFunc(req.body);
        }

        return isMatch;
    }

    handle(basePath, req, res) {
        let self = this;

        let incomeReqPath = req.path.indexOf(basePath) === 0 ? req.path.replace(basePath, '') : req.path;
        let evaluateContext = {
            req: {
                method: req.method,
                basePath: basePath,
                path: incomeReqPath,
                query: req.query,
                body: req.body,
                headers: req.headers
            }
        }

        for (let headerKey in self.response.headers) {
            let headerValue = self.response.headers[headerKey];
            headerValue = recurrsiveEvaluate(headerValue).evaluate(evaluateContext);
            headerValue = recurrsiveMock(headerValue).mock();
            res.set(headerKey, headerValue);
        }

        let responseStatus = self.response.status;
        if (Middleware.isMiddleware(responseStatus)) {
            responseStatus = recurrsiveEvaluate(responseStatus).evaluate(evaluateContext);
            responseStatus = recurrsiveMock(responseStatus).mock();
        }

        let responseBody = self.response.body;
        if (typeof responseBody === 'object') {
            responseBody = recurrsiveEvaluate(responseBody).evaluate(evaluateContext);
            responseBody = recurrsiveMock(responseBody).mock();
        }

        res.status(responseStatus).send(responseBody);
        return true;
    }

}

module.exports = Contract;