'use strict';
var coreTypes = require('./core-types');
var { Middleware, Feature, Evaluator, Comparable, Mockable } = coreTypes.types;
var { recurrsiveToString } = coreTypes.utils;

var RandExp = require('randexp');
var jp = require('jsonpath');

const float = function (options = {}) {
    let compare = new Middleware({
        type: 'float',
        features: [
            Comparable, Mockable
        ],
        options: {
            gt: options.gt,
            gte: options.gte,
            lt: options.lt,
            lte: options.lte
        },
        compareFunc: function (value) {
            if (typeof value !== 'number') {
                return false;
            }
            if (this.options.gt !== undefined && value <= this.options.gt) {
                return false;
            }
            if (this.options.gte !== undefined && value < this.options.gte) {
                return false;
            }
            if (this.options.lt !== undefined && value >= this.options.lt) {
                return false;
            }
            if (this.options.lte !== undefined && value > this.options.lte) {
                return false;
            }
            return true;
        },
        mock: function () {
            let max = undefined;
            if (this.options.lt !== undefined && (max === undefined || this.options.lt < max)) {
                max = this.options.lt;
            }
            if (this.options.lte !== undefined && (max === undefined || this.options.lte < max)) {
                max = this.options.lte;
            }
            let min = undefined;
            if (this.options.gt !== undefined && (min === undefined || this.options.gt > min)) {
                min = this.options.gt;
            }
            if (this.options.gte !== undefined && (min === undefined || this.options.gte > min)) {
                min = this.options.gte;
            }
            if (max !== undefined && min === undefined) {
                min = max > 0 ? 0 : max - 100;
            } else if (min !== undefined && max === undefined) {
                max = min < 0 ? 0 : min + 100;
            } else if (max === undefined && min === undefined) {
                min = 0;
                max = 100;
            }

            return Math.random() * (max - min) + min;
        },
        toJsonString: function () {
            return `float(${JSON.stringify(this.options)})`;
        }
    });
    return compare;
}

const integer = function (options = {}) {
    let compare = new Middleware({
        type: 'integer',
        features: [
            Comparable, Mockable
        ],
        options: {
            gt: options.gt,
            gte: options.gte,
            lt: options.lt,
            lte: options.lte
        },
        compareFunc: function (value) {
            if (typeof value !== 'number') {
                return false;
            }
            if (this.options.gt !== undefined && value <= this.options.gt) {
                return false;
            }
            if (this.options.gte !== undefined && value < this.options.gte) {
                return false;
            }
            if (this.options.lt !== undefined && value >= this.options.lt) {
                return false;
            }
            if (this.options.lte !== undefined && value > this.options.lte) {
                return false;
            }
            if (Math.floor(value) !== value) {
                return false;
            }
            return true;
        },
        mock: function () {
            let max = undefined;
            if (this.options.lt !== undefined && (max === undefined || this.options.lt < max)) {
                max = this.options.lt;
            }
            if (this.options.lte !== undefined && (max === undefined || this.options.lte < max)) {
                max = this.options.lte;
            }
            let min = undefined;
            if (this.options.gt !== undefined && (min === undefined || this.options.gt > min)) {
                min = this.options.gt;
            }
            if (this.options.gte !== undefined && (min === undefined || this.options.gte > min)) {
                min = this.options.gte;
            }
            if (max !== undefined && min === undefined) {
                min = max > 0 ? 0 : max - 100;
            } else if (min !== undefined && max === undefined) {
                max = min < 0 ? 0 : min + 100;
            } else if (max === undefined && min === undefined) {
                min = 0;
                max = 100;
            }

            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        toJsonString: function () {
            return `integer(${JSON.stringify(this.options)})`;
        }
    });
    return compare;
}

const regex = function (pattern) {
    let compare = new Middleware({
        type: 'regex',
        features: [
            Comparable, Mockable
        ],
        options: {
            pattern: pattern
        },
        compareFunc: function (value) {
            if (value) {
                let stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                //let stringValue = JSON.stringify(value);
                let matchResult = stringValue.match(this.options.pattern);
                return matchResult && matchResult[0].length === stringValue.length;
            }
            return false;
        },
        mock: function () {
            return new RandExp(new RegExp(this.options.pattern)).gen();
        },
        toJsonString: function () {
            return 'regex(' + JSON.stringify(pattern) + ')';
        }
    });
    return compare;
}

const recurrsiveEvaluate = function (object) {
    let middleware = new Middleware({
        type: 'recurrsiveCompare',
        features: [
            Evaluator
        ],
        options: {
            object: object
        },
        evaluate: function (context) {
            let returnObj = {};

            let currObject = this.options.object;
            if (typeof currObject === 'object' && Array.isArray(currObject)) {
                returnObj = [];
            }

            if (typeof currObject === 'object') {
                if (currObject instanceof Middleware) {
                    if (currObject.hasFeature(Evaluator)) {
                        returnObj = currObject.execute({
                            features: [Evaluator],
                            evaluate: [context]
                        });
                    } else {
                        returnObj = currObject;
                    }

                } else {
                    for (let key in currObject) {
                        let property = currObject[key]
                        returnObj[key] = recurrsiveEvaluate(property).evaluate(context);
                    }
                }

            } else {
                returnObj = currObject;
            }
            return returnObj;
        },
        toJsonString: function () {
            return 'recurrsiveCompare(' + recurrsiveToString(object) + ')';
        }
    });
    return middleware;
}

const recurrsiveMock = function (object) {
    let mock = new Middleware({
        type: 'recurrsiveMock',
        features: [
            Mockable
        ],
        options: {
            object: object
        },
        mock: function () {
            let returnObj = {};

            let currObject = this.options.object;
            if (typeof currObject === 'object' && Array.isArray(currObject)) {
                returnObj = [];
            }

            if (typeof currObject === 'object') {
                if (currObject instanceof Middleware) {
                    if (currObject.hasFeature(Mockable)) {
                        returnObj = currObject.mock();
                    } else {
                        returnObj = currObject;
                    }

                } else {
                    for (let key in currObject) {
                        let property = currObject[key]
                        returnObj[key] = recurrsiveMock(property).mock();
                    }
                }

            } else {
                returnObj = currObject;
            }
            return returnObj;
        },
        toJsonString: function () {
            return 'recurrsiveMock(' + recurrsiveToString(object) + ')';
        }
    });
    return mock;
}

const recurrsiveCompare = function (object) {
    let compare = new Middleware({
        type: 'recurrsiveCompare',
        features: [
            Comparable
        ],
        options: {
            object: object
        },
        compareFunc: function (target) {
            if (target) {
                let match = true;
                let currentObj = this.options.object;
                if (typeof currentObj === 'object') {
                    if (currentObj instanceof Middleware) {
                        currentObj = currentObj.execute({
                            features: [Evaluator]
                        });
                    }
                    if (currentObj instanceof Middleware && currentObj.hasFeature(Comparable)) {
                        return currentObj = currentObj.compareFunc(target);
                    }

                    for (let key in currentObj) {
                        if (object[key] instanceof Middleware && object[key].hasFeature(Comparable)) {
                            match = match && currentObj[key].compareFunc(target[key]);
                        } else {
                            match = match && recurrsiveCompare(currentObj[key]).compareFunc(target[key]);
                        }
                        if (!match) {
                            break;
                        }
                    }
                    return match;
                } else {
                    return JSON.stringify(this.options.object) === JSON.stringify(target);
                }
            }
            return target === this.options.object;
        },
        toJsonString: function () {
            return 'recurrsiveCompare(' + recurrsiveToString(object) + ')';
        }
    });
    return compare;
}

const jsonpath = function (pathExpression) {
    let query = new Middleware({
        type: 'jsonpath',
        features: [
            Evaluator
        ],
        options: {
            pathExpression: pathExpression
        },
        evaluate: function (context) {
            return jp.query(context, this.options.pathExpression);
        },
        toJsonString: function () {
            return `jsonpath(${JSON.stringify(this.options.pathExpression)})`;
        }
    });
    return query;
}

const value = function (props) {
    let stubValue = props.stub || props.client || props.consumer;
    let testValue = props.test || props.server || props.producer;
    let evaluateFunction = props.evaluateFunction || function () {
        return this.options.stubValue;
    };

    let consumerProducerValue = new Middleware({
        type: 'ConsumerProducerValue',
        features: [Evaluator],
        options: {
            stubValue: stubValue,
            testValue: testValue
        },
        evaluate: evaluateFunction,
        toJsonString: function () {
            return `value({stub: ${recurrsiveToString(this.options.stubValue)}, test: ${recurrsiveToString(this.options.testValue)} })`;
        }
    });
    return consumerProducerValue;
}

const stubValue = function (props) {
    let stubValue = props.stub || props.client || props.consumer;
    let testValue = props.test || props.server || props.producer;
    let evaluateFunction = props.evaluateFunction || function () {
        return this.options.stubValue;
    };

    let consumerProducerValue = new Middleware({
        type: 'stubValue',
        features: [Evaluator],
        options: {
            stubValue: stubValue,
            testValue: testValue
        },
        evaluate: evaluateFunction,
        toJsonString: function () {
            return `${recurrsiveToString(this.options.stubValue)}`;
        }
    });
    return consumerProducerValue;
}

const testValue = function (props) {
    let stubValue = props.stub || props.client || props.consumer;
    let testValue = props.test || props.server || props.producer;
    let evaluateFunction = props.evaluateFunction || function () {
        return this.options.testValue;
    };

    let consumerProducerValue = new Middleware({
        type: 'testValue',
        features: [Evaluator],
        options: {
            stubValue: stubValue,
            testValue: testValue
        },
        evaluate: evaluateFunction,
        toJsonString: function () {
            return `${recurrsiveToString(this.options.testValue)}`;
        }
    });
    return consumerProducerValue;
}

Object.assign(module.exports, {
    middlewares: {
        jsonpath,
        regex,
        integer,
        float,
        recurrsiveCompare,
        recurrsiveEvaluate,
        recurrsiveMock,
        value,
        stubValue,
        testValue
    }
});