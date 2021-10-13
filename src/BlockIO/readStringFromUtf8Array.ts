



export function readStringFromUtf8Array(v: DataView, offset: number, length: number = -1) {
    var out = [], pos = offset, c = 0;
    while ((length === -1 && pos < v.byteLength) || (pos - offset < length)) {
        var c1 = v.getUint8(pos++);
        if (c1 < 128) {
            if (c1 === 0) {
                break;
            }
            out[c++] = String.fromCharCode(c1);
        } else if (c1 > 191 && c1 < 224) {
            var c2 = v.getUint8(pos++);
            out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
        } else if (c1 > 239 && c1 < 365) {
            // Surrogate Pair
            var c2 = v.getUint8(pos++);
            var c3 = v.getUint8(pos++);
            var c4 = v.getUint8(pos++);
            var u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) -
                0x10000;
            out[c++] = String.fromCharCode(0xD800 + (u >> 10));
            out[c++] = String.fromCharCode(0xDC00 + (u & 1023));
        } else {
            var c2 = v.getUint8(pos++);
            var c3 = v.getUint8(pos++);
            out[c++] =
                String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
        }
    }
    return out.join('');
}