

export function string_reverse(input: string) {
    if (input === undefined) { return undefined; }
    let ret = "";
    for (let i = input.length - 1; i >= 0; i--) {
        ret = ret + input[i];
    }
    return ret;
}