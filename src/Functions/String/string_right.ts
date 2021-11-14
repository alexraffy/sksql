



export function string_right(input: string, length: number) {
    if (input === undefined) { return undefined; }
    return input.substr((input.length -1) - length);
}