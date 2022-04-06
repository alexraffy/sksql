import {ITableData} from "../Table/ITableData";
import {ITableCursor} from "./ITableCursor";
import {ITableDefinition} from "../Table/ITableDefinition";
import {blockInfo} from "../Blocks/blockInfo";
import {recordSize} from "../Table/recordSize";
import {ITable} from "../Table/ITable";

// Position the cursor on the next record

export function readNext(table: ITable, tableDef: ITableDefinition, cursor: ITableCursor): ITableCursor {

    let block = blockInfo(table.data.blocks[cursor.blockIndex]);
    cursor.offset += cursor.rowLength + 5;

    // do we still have rows in this block
    if (cursor.offset >= block.end) {
        if (cursor.blockIndex + 1 === table.data.blocks.length) {
            // reached the end of the blocks
            cursor.offset = -1;
        } else {
            cursor.blockIndex++;
            let block = blockInfo(table.data.blocks[cursor.blockIndex]);
            cursor.offset = block.start;

            if (cursor.offset >= block.end) {
                // now rows in this block
                cursor.offset = -1;
            }
        }
    }

    return cursor;
}