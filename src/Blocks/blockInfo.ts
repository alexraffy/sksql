import {BlockType} from "./BlockType";
import {kBlockHeaderField} from "./kBlockHeaderField";
import {IBlockInfo} from "./IBlockInfo";

/*
    returns block information of the SharedArrayBuffer

 */
export function blockInfo(b: ArrayBuffer | SharedArrayBuffer): IBlockInfo {
    let dv = new DataView(b, 0);
    const blockType = dv.getUint8(kBlockHeaderField.BlockType);
    const blockId = dv.getUint32(kBlockHeaderField.BlockId);
    // b5:  data start
    const dataStart = dv.getUint32(kBlockHeaderField.DataStart);
    // b9: data end
    const dataEnd = dv.getUint32(kBlockHeaderField.DataEnd);
    // tabledef b13 - 16, last row id
    const rowId = dv.getUint32(kBlockHeaderField.LastRowId);
    // tabledef b17 - b20, num rows
    const numRows = dv.getUint32(kBlockHeaderField.NumRows);
    // 21 - 25, reserved
    
    return {
        blockId: blockId,
        type: blockType,
        start: dataStart,
        end: dataEnd,
        rowId: rowId,
        numRows: numRows
    };
}