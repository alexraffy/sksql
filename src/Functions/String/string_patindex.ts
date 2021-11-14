


export function string_patindex(input: string, pattern: string) {
    if (input === undefined) { return undefined; }
    let re = new RegExp(pattern);
    let ret = re.exec(input);
    if (ret !== null) {
        return re.lastIndex;
    }
    return -1;
}