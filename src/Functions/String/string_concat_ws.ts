


export function string_concat_ws(sep: string, inputA: string, inputB: string) {
    if (inputA === undefined) { return undefined; }
    if (inputB === undefined) { return undefined; }
    return inputA + sep + inputB;
}