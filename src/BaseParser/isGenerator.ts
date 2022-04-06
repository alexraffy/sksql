

// Is the function a generator function
// a generator function yield other function

function isGenerator(obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}
export function isGeneratorFunction(obj) {
    var constructor = obj.constructor;
    if (!constructor) return false;
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
    return isGenerator(constructor.prototype);
}