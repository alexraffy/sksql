
// Write a 0 terminated UTF8 string to a DataView
// erasing maxLengthInBytes

import {TParserError} from "../API/TParserError";

export function writeStringToUtf8ByteArray (dataView: DataView, offset: number, str: string, maxLengthInBytes: number) {
    if (str === undefined) {
        throw new TParserError("writeStringToUtf8ByteArray called with an undefined string.");
    }
    let p = offset;
    for (var i = 0; i < maxLengthInBytes; i++) {
        if (i >= str.length ) {
            if (p < maxLengthInBytes) {
                dataView.setUint8(p++, 0);
            }
            continue;
        }
        var c = str.charCodeAt(i);
        if (c < 128) {
            dataView.setUint8(p++, c);
        } else if (c < 2048) {
            dataView.setUint8(p++, (c >> 6) | 192);
            dataView.setUint8(p++, (c & 63) | 128);
        } else if (
            ((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
            ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
            // Surrogate Pair
            c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
            dataView.setUint8(p++, (c >> 18) | 240);
            dataView.setUint8(p++, ((c >> 12) & 63) | 128);
            dataView.setUint8(p++, ((c >> 6) & 63) | 128);
            dataView.setUint8(p++, (c & 63) | 128);
        } else {
            dataView.setUint8(p++, (c >> 12) | 224);
            dataView.setUint8(p++, ((c >> 6) & 63) | 128);
            dataView.setUint8(p++, (c & 63) | 128);
        }
    }
}