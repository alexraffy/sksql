



export function string_padRight(input: string, padWith: string, length: number ) {
    if (input === undefined) { return undefined; }
    let ret = input;
    while (ret.length < length) {
        ret = ret + padWith;
    }
    return ret;
}