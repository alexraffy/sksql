import {ITableData} from "./ITableData";
import {newBlock} from "../Blocks/newBlock";
import {BlockType} from "../Blocks/BlockType";
import {freeSpaceInBlock} from "../Blocks/freeSpaceInBlock";
import {recordSize} from "./recordSize";
import {getLastRowId} from "../BlockIO/getLastRowId";
import {setLastRowId} from "../BlockIO/setLastRowId";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";


export const rowHeaderSize = 4 + // ROWID
                             1; // FLAG


/*
    adds a row to the table and returns the full row DataView

    if the last block does not have the space required, a new block of size growBy will be generated.

 */
export function addRow(tb: ITableData, growBy: number = 4096): DataView {
    const length = recordSize(tb);
    let d: ArrayBuffer | SharedArrayBuffer = undefined;
    if (tb.blocks === undefined || tb.blocks.length === 0) {
        d = newBlock(growBy, BlockType.rows, tb.blocks.length + 1);
        tb.blocks = [d];
    } else {
        d = tb.blocks[tb.blocks.length -1];
        if (freeSpaceInBlock(d) < length + rowHeaderSize) {
            d = newBlock(4096, BlockType.rows, tb.blocks.length+1);
            tb.blocks.push(d);
        }
    }
    let dv = new DataView(d);
    let offset = dv.getUint32(kBlockHeaderField.DataEnd);
    let rowId = getLastRowId(tb) + 1;
    setLastRowId(tb, rowId);
    // set the rowId and flag
    dv.setUint32(offset, rowId);
    dv.setUint8(offset + 4, 0);
    // update the next offset
    dv.setUint32(kBlockHeaderField.DataEnd, offset + length + rowHeaderSize);
    // return a dataview of the empty record
    return new DataView(d, offset, length + rowHeaderSize);
}