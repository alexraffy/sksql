

var getGeneratorFunc = function () { // eslint-disable-line consistent-return
    if (!Object.prototype.toString) {
        return false;
    }
    try {
        return Function('return function*() {}')();
    } catch (e) {
    }
};

var GeneratorFunction = (function*(){yield undefined;}).constructor;

export function isGenerator(fn): boolean {
    if (typeof fn !== 'function') {
        return false;
    }
    if (/^\s*(?:function)?\*/.test(Function.prototype.toString.call(fn))) {
        return true;
    }
    try {
        let fnT = fn("isGenerator");
        if (fnT instanceof GeneratorFunction) {
            return true;
        }

        if (typeof fnT[Symbol.iterator] == 'function' &&
            typeof fnT['next'] == 'function' &&
            typeof fnT['throw'] == 'function') {
            return true;
        }
    } catch (e) {
        return false;
    }

    if (Object.prototype.toString) {
        var str = Object.prototype.toString.call(fn);
        return str === '[object GeneratorFunction]';
    }
    if (!Object.getPrototypeOf) {
        return false;
    }
    if (typeof GeneratorFunction === 'undefined') {
        var generatorFunc = getGeneratorFunc();
        GeneratorFunction = generatorFunc ? Object.getPrototypeOf(generatorFunc) : false;
    }
    return Object.getPrototypeOf(fn) === GeneratorFunction;

}