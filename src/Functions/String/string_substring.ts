



export function string_substring(input: string, start: number, length: number) {
    if (input === undefined) { return undefined; }
    return input.substr(start, length);
}