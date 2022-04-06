

// pad a string with character char until the string has the length size

export const padLeft = (str, size, char) => {
    let ret = str;
    while (ret.length < size) {
        ret = char + ret;
    }
    return ret;
}