import {readStringFromUtf8Array} from "./readStringFromUtf8Array";


// Decompress an ArrayBuffer compressed with compressAB

export function decompress(ab: ArrayBuffer, returnSharedArrayBuffer: boolean): ArrayBuffer {
    let dv = new DataView(ab);
    let idx = 0;

    // read delimiter
    let delimSize = dv.getUint8(idx);
    idx++;
    let delim = readStringFromUtf8Array(dv, idx, delimSize);
    idx += delimSize;
    // read decompressed size
    let newSize = dv.getUint32(idx);
    idx += 4;
    let dest : ArrayBuffer | SharedArrayBuffer;
    if (returnSharedArrayBuffer) {
        dest = new SharedArrayBuffer(newSize);
    } else {
        dest = new ArrayBuffer(newSize);
    }
    let dvdest = new DataView(dest);
    idx++;
    let idxDest = 0;
    while (idx < dv.byteLength) {
        let value = dv.getUint8(idx);
        if (value === delim.charCodeAt(0)) {
            let gotDelim = true;
            for (let i = 1; i < delimSize; i++) {
                let val = dv.getUint8(idx + i);
                if (val !== delim.charCodeAt(i)) {
                    gotDelim = false;
                    break;
                }
            }
            if (gotDelim == true) {
                idx += 4;
                let count = dv.getUint32(idx);
                idx += 3;
                for (let i = 0; i < count; i++) {
                    dvdest.setUint8(idxDest, 0);
                    idxDest++;
                }
            } else {
                dvdest.setUint8(idxDest, value);
                idxDest++;
            }
        } else {
            dvdest.setUint8(idxDest, value);
            idxDest++;
        }

        idx++;
    }
    return dest;
}