'use strict';

class Middleware {
    constructor(props) {
        this.type = props.type || null;
        this.options = props.options || {};
        this.toJsonString = props.toJsonString.bind(this);

        this.features = props.features || [];
        for (let feature of this.features) {
            feature.bindFunc(this, props);
        }
    }

    hasFeature(feature) {
        return this.features.indexOf(feature) >= 0;
    }

    execute(props) {
        let result = this;
        let done = false;
        do {
            if (result instanceof Middleware) {
                if (props.features.indexOf(Evaluator) >= 0 && result.hasFeature(Evaluator)) {
                    result = result.evaluate.apply(result, props.evaluate);
                    continue;
                } else if (props.features.indexOf(Mockable) >= 0 && result.hasFeature(Mockable)) {
                    result = result.mock();
                    continue;
                } else if (props.features.indexOf(Comparable) >= 0 && result.hasFeature(Comparable)) {
                    result = result.compareFunc.apply(result, props.compareFunc);
                    continue;
                }
            }
            done = true;
        } while (!done);
        return result;
    }
}

class Feature {}

class Evaluator extends Feature {
    static get type() {
        return 'Evaluator';
    }
    static bindFunc(self, props) {
        self.evaluate = props.evaluate.bind(self);
    }
}
class Comparable extends Feature {
    static get type() {
        return 'Comparable';
    }
    static bindFunc(self, props) {
        self.compareFunc = props.compareFunc.bind(self);
    }
}
class Mockable extends Feature {
    static get type() {
        return 'Mockable';
    }
    static bindFunc(self, props) {
        self.mock = props.mock.bind(self);
    }
}

const recurrsiveToString = function (obj) {
    if (obj instanceof Middleware && obj.hasFeature(Comparable)) {
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

Object.assign(module.exports, {
    types: { Middleware, Feature, Evaluator, Comparable, Mockable },
    utils: { recurrsiveToString }
});