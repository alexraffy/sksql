




export function compareBytesBetweenDV(length: number, source: DataView, target: DataView, offsetStart: number = 0, offsetTarget: number = 0): number {
    for (let i = 0; i < length; i++) {
        let a = source.getUint8(offsetStart + i);
        let b = target.getUint8(offsetTarget + i);
        if (a != b) {
            return i;
        }
    }
    return -1;
}


