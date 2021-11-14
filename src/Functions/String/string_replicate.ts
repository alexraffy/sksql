


export function string_replicate(input: string, num: number) {
    if (input === undefined) { return undefined; }
    let ret = "";
    for (let i = 0; i < num; i++) {
        ret = ret + input;
    }
    return ret;
}