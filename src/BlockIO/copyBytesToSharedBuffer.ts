



export function copyBytesToSharedBuffer(source: ArrayBuffer, target: DataView, offsetStart: number = 0, offsetTarget: number = 0) {
    let length = source.byteLength;
    for (let i = offsetStart; i < length; i++) {
        target.setUint8(offsetTarget + i, source[i]);
    }
}

