import {BlockType} from "./BlockType";
import {kBlockHeaderField} from "./kBlockHeaderField";
import {SKSQL} from "../API/SKSQL";


/*
    Creates a new block of size blockSize
 */
export function newBlock(blockSize: number = 65536, blockType: BlockType, blockId: number): ArrayBuffer | SharedArrayBuffer {
    let ret: ArrayBuffer | SharedArrayBuffer = undefined;
    if (SKSQL.supportsSharedArrayBuffers) {
        ret = new SharedArrayBuffer(blockSize);
    } else {
        ret = new ArrayBuffer(blockSize);
    }
    let dv = new DataView(ret);
    let ofs = 0;
    for (let i = 0; i < blockSize; i++) {
        dv.setUint8(i, 0);
    }
    dv.setUint8(kBlockHeaderField.BlockType, blockType);
    dv.setUint32(kBlockHeaderField.BlockId, blockId);
    // b5:  data start
    dv.setUint32(kBlockHeaderField.DataStart, 25);
    // b9: data end
    dv.setUint32(kBlockHeaderField.DataEnd, 25);
    // tabledef b13 - 16, last row id
    dv.setUint32(kBlockHeaderField.LastRowId, 0);
    // tabledef b17 - b20, num rows
    dv.setUint32(kBlockHeaderField.NumRows, 0); ofs += 4;
    // tabledef b21, block dirty
    dv.setUint8(kBlockHeaderField.BlockDirty, 1); ofs += 1;

    // 22 - 24, reserved
    return ret;
}