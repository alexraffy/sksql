




export function string_left(input: string, length: number) {
    if (input === undefined) { return undefined; }
    return input.substr(0, length);
}