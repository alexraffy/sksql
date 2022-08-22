import {BlockType} from "./BlockType";
import {offs} from "./kBlockHeaderField";
import {IBlockInfo} from "./IBlockInfo";

/*
    returns block information of the SharedArrayBuffer

 */
export function blockInfo(b: ArrayBuffer | SharedArrayBuffer): IBlockInfo {
    let dv = new DataView(b, 0);
    const blockType = dv.getUint8(offs().BlockType);
    const blockId = dv.getUint32(offs().BlockId);
    // b5:  data start
    const dataStart = dv.getUint32(offs().DataStart);
    // b9: data end
    const dataEnd = dv.getUint32(offs().DataEnd);
    // tabledef b13 - 16, last row id
    const rowId = dv.getUint32(offs().LastRowId);
    // tabledef b17 - b20, num rows
    const numRows = dv.getUint32(offs().NumRows);
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