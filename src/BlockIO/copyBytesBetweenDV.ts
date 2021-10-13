/*
    copy length bytes from source: DataView to target: DataView
 */
export function copyBytesBetweenDV(length: number, source: DataView, target: DataView, offsetStart: number = 0, offsetTarget: number = 0) {
    for (let i = 0; i < length; i++) {
        target.setUint8(offsetTarget + i, source.getUint8(offsetStart + i));
    }
}