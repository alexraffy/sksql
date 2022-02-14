


export function compressAB(ab: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
    let newBuffer = new ArrayBuffer(ab.byteLength + 3);
    let dvdest = new DataView(newBuffer);
    let dvsrc = new DataView(ab);

    let countingZeroes = 0;
    let idx = -1;

    let delim = "$0Z$";

    dvdest.setUint8(++idx, 4);
    dvdest.setUint8(++idx, delim.charCodeAt(0));
    dvdest.setUint8(++idx, delim.charCodeAt(1));
    dvdest.setUint8(++idx, delim.charCodeAt(2));
    dvdest.setUint8(++idx, delim.charCodeAt(3));
    dvdest.setUint32(++idx, ab.byteLength);
    idx += 4;

    for (let i = 0; i < dvsrc.byteLength; i++) {
        let val = dvsrc.getUint8(i);
        if (val === 0) {
            countingZeroes++;
        } else {
            if (countingZeroes > 0) {
                if (countingZeroes < 9) {
                    for (let x = 0; x < countingZeroes; x++) {
                        idx++;
                        dvdest.setUint8(idx, 0);
                    }
                } else {
                    idx++;
                    dvdest.setUint8(idx, delim.charCodeAt(0));
                    idx++;
                    dvdest.setUint8(idx, delim.charCodeAt(1));
                    idx++;
                    dvdest.setUint8(idx, delim.charCodeAt(2));
                    idx++;
                    dvdest.setUint8(idx, delim.charCodeAt(3));
                    idx++;
                    dvdest.setUint32(idx, countingZeroes);
                    idx += 3;
                }
                countingZeroes = 0;
            }
            idx++;
            dvdest.setUint8(idx, val);
        }
    }
    if (countingZeroes > 0) {
        if (countingZeroes < 9) {
            for (let x = 0; x < countingZeroes; x++) {
                idx++;
                dvdest.setUint8(idx, 0);
            }
        } else {
            idx++;
            dvdest.setUint8(idx, delim.charCodeAt(0));
            idx++;
            dvdest.setUint8(idx, delim.charCodeAt(1));
            idx++;
            dvdest.setUint8(idx, delim.charCodeAt(2));
            idx++;
            dvdest.setUint8(idx, delim.charCodeAt(3));
            idx++;
            dvdest.setUint32(idx, countingZeroes);
            idx += 3;
        }
        countingZeroes = 0;
    }
    idx++;

    return newBuffer.slice(0, idx);

}