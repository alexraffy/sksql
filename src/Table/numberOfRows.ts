import {ITableDefinition} from "./ITableDefinition";
import {ITable} from "./ITable";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {isRowDeleted} from "../Cursor/isRowDeleted";

/*
    SCAN the whole table and calculate the number of active rows.
 */
export function numberOfRows(table: ITable, def: ITableDefinition): number {
    let cursor = readFirst(table, def);
    let num_rows = 0;
    while (!cursorEOF(cursor)) {
        if (!isRowDeleted(table.data, cursor)) {
            num_rows++;
        }
        cursor = readNext(table, def, cursor);
    }
    return num_rows;
}