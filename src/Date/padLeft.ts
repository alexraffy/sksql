



export const padLeft = (str, size, char) => {
    let ret = str;
    while (ret.length < size) {
        ret = char + ret;
    }
    return ret;
}