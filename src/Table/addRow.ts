import {ITableData} from "./ITableData";
import {newBlock} from "../Blocks/newBlock";
import {BlockType} from "../Blocks/BlockType";
import {freeSpaceInBlock} from "../Blocks/freeSpaceInBlock";
import {recordSize} from "./recordSize";
import {getLastRowId} from "../BlockIO/getLastRowId";
import {setLastRowId} from "../BlockIO/setLastRowId";
import {offs} from "../Blocks/kBlockHeaderField";
import {kModifiedBlockType, TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {addModifiedBlockToContext} from "../ExecutionPlan/addModifiedBlockToContext";
import {readTableName} from "./readTableName";


export const rowHeaderSize = 4 + // ROWID
                             1; // FLAG


/*
    adds a row to the table and returns the full row DataView
    if the last block does not have the space required, a new block of size growBy will be generated.
    the block will be added to the list of modified blocks in context
 */
export function addRow(tb: ITableData, growBy: number = 4096, context: TExecutionContext): DataView {
    const length = recordSize(tb);
    if (length * 10 > growBy) {
        growBy = length * 10;
    }
    const name = readTableName(tb);
    let d: ArrayBuffer | SharedArrayBuffer = undefined;
    if (tb.blocks === undefined || tb.blocks.length === 0) {
        d = newBlock(growBy, BlockType.rows, tb.blocks.length + 1);
        tb.blocks = [d];
        addModifiedBlockToContext(context, kModifiedBlockType.tableBlock, name, 0);
    } else {
        d = tb.blocks[tb.blocks.length -1];
        let size = tb.blocks[0].byteLength;
        if (freeSpaceInBlock(d) < length + rowHeaderSize) {
            d = newBlock(size, BlockType.rows, tb.blocks.length+1);
            tb.blocks.push(d);
        }
        addModifiedBlockToContext(context, kModifiedBlockType.tableBlock, name, tb.blocks.length - 1);
    }
    let dv = new DataView(d);
    let offset = dv.getUint32(offs().DataEnd);
    let rowId = getLastRowId(tb) + 1;
    setLastRowId(tb, rowId);
    // mark block as dirty
    dv.setUint8(offs().BlockDirty, 1);
    // set the rowId and flag
    dv.setUint32(offset, rowId);
    dv.setUint8(offset + 4, 0);
    // update the next offset
    dv.setUint32(offs().DataEnd, offset + length + rowHeaderSize);
    // return a dataview of the empty record
    return new DataView(d, offset, length + rowHeaderSize);
}