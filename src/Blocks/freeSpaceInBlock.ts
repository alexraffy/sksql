import {offs} from "./kBlockHeaderField";

/*
    Check the amount of space free in the block by checking the address of the last record entered in the block
 */
export function freeSpaceInBlock(d: ArrayBuffer | SharedArrayBuffer): number {
    let ret = 0;
    let dv = new DataView(d);
    return d.byteLength - dv.getUint32(offs().DataEnd);
}