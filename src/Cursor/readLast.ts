import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITableCursor} from "./ITableCursor";
import {blockInfo} from "../Blocks/blockInfo";


export function readLast(table: ITable, tableDef: ITableDefinition, cursor: ITableCursor): ITableCursor {
    cursor.blockIndex = table.data.blocks.length -1;
    let block = blockInfo(table.data.blocks[cursor.blockIndex]);
    cursor.offset = block.end - cursor.rowLength - 5;

    return cursor;
}