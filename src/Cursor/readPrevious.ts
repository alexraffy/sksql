import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITableCursor} from "./ITableCursor";
import {blockInfo} from "../Blocks/blockInfo";

// Rewind back to the previous record

export function readPrevious(table: ITable, tableDef: ITableDefinition, cursor: ITableCursor): ITableCursor {

    let block = blockInfo(table.data.blocks[cursor.blockIndex]);
    cursor.offset -= (cursor.rowLength + 5);

    // do we still have rows in this block
    if (cursor.offset < block.start) {
        if (cursor.blockIndex - 1 === -1) {
            // reached the end of the blocks
            cursor.offset = -1;
        } else {
            cursor.blockIndex--;
            let block = blockInfo(table.data.blocks[cursor.blockIndex]);
            cursor.offset = block.end - (cursor.rowLength + 5);

            if (cursor.offset < block.start) {
                // now rows in this block
                cursor.offset = -1;
            }
        }
    }

    return cursor;
}