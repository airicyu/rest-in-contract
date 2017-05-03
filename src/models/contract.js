const Request = require('./request.js');
const Response = require('./response.js');
const uuid = require('uuid/v4');
const middlewares = require('./../contract-script/middlewares/middlewares');

const { recurrsiveToString } = middlewares.utils;
const { Middleware } = middlewares.types;
const { recurrsiveEvaluate, recurrsiveCompare, recurrsiveMock, stubValue, testValue } = middlewares.builtin;
const sandboxRunner = require('./../contract-script/sandbox/sandbox-runner');
const beautify = require('js-beautify').js_beautify;
var hal = require('hal');

class Contract {
    constructor(props) {
        let self = this;
        self.id = props.id;
        self.name = props.name || self.id;
        self.request = new Request(props.request || {});
        self.response = new Response(props.response || {});
    }

    static newFromScript(contractScript) {
        let contract = new Contract(sandboxRunner.runScript(contractScript), {});
        return contract;
    }

    toHal() {
        let contract = this;

        let contractHal = new hal.Resource({
            id: contract.id,
            name: contract.name,
            contractsScript: contract.toContractCompatScript()
        }, `/api/v1/contracts/${contract.id}`);
        return contractHal;
    }

    toContractCompatScript() {
        let contractScript = "module.exports = " + recurrsiveToString(this);
        return contractScript;
    }

    toContractScript() {
        let contractScript = "module.exports = " + recurrsiveToString(this);
        contractScript = beautify(contractScript, { indent_size: 2 })
        return contractScript;
    }

    toStubContractScript() {
        let contractScript = "module.exports = " + recurrsiveToString(this);
        let stubContract = new Contract(sandboxRunner.runScript(contractScript, {
            value: stubValue
        }));
        let stubContractScript = "module.exports = " + recurrsiveToString(stubContract);
        stubContractScript = beautify(stubContractScript, { indent_size: 2 })
        return stubContractScript;
    }

    toStubContract() {
        let contractScript = "module.exports = " + recurrsiveToString(this);
        let stubContract = new Contract(sandboxRunner.runScript(contractScript, {
            value: stubValue
        }));
        return stubContract;
    }

    toTestingContractScript() {
        let contractScript = "module.exports = " + recurrsiveToString(this);
        let testContract = new Contract(sandboxRunner.runScript(contractScript, {
            value: testValue
        }));
        let testContractScript = "module.exports = " + recurrsiveToString(testContract);
        testContractScript = beautify(testContractScript, { indent_size: 2 })
        return testContractScript;
    }

    toTestingContract() {
        let contractScript = "module.exports = " + recurrsiveToString(this);
        let testContract = new Contract(sandboxRunner.runScript(contractScript, {
            value: testValue
        }));
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
            }
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
                isMatch = isMatch && recurrsiveCompare(headerValue).compareFunc(req.headers[headerKey]);
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
        if (responseStatus instanceof Middleware) {
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