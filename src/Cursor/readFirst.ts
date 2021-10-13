import {ITableData} from "../Table/ITableData";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITableCursor} from "./ITableCursor";
import {recordSize} from "../Table/recordSize";
import {blockInfo} from "../Blocks/blockInfo";
import {ITable} from "../Table/ITable";



export function readFirst(table: ITable, tableDef: ITableDefinition): ITableCursor {
    let cursor: ITableCursor = {
        tableIndex: tableDef.id,
        blockIndex: -1,
        rowLength: recordSize(table.data),
        offset: -1
    };
    if (table.data.blocks.length === 0) {
        return cursor;
    }
    cursor.blockIndex = 0;
    let block = blockInfo(table.data.blocks[0]);
    cursor.offset = block.start;

    if (cursor.offset >= block.end) {
        cursor.offset = -1;
        return cursor;
    }

    return cursor;
}