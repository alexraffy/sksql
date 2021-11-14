


export function string_rtrim(input: string) {
    if (input === undefined) { return undefined; }
    let ret = input;
    while (ret.length > 0 && ret[ret.length -1] === " ") {
        ret = ret.substr(0, ret.length - 1);
    }
    return ret;
}