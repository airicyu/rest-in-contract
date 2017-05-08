'use strict';

const { recurrsiveToString } = require('./utils');

class Middleware {
    constructor(props) {
        this.serialId = '8e2dc6a8-0b49-4506-b705-d2a47456376b'
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
                if (props.features.includes(Evaluator) && result.hasFeature(Evaluator)) {
                    result = result.evaluate.apply(result, props.evaluate);
                    continue;
                } else if (props.features.includes(Mockable) && result.hasFeature(Mockable)) {
                    result = result.mock();
                    continue;
                } else if (props.features.includes(Comparable) && result.hasFeature(Comparable)) {
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

Object.assign(module.exports, {
    types : { Middleware, Feature, Evaluator, Comparable, Mockable }
});