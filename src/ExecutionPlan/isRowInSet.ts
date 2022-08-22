import {ITableData} from "../Table/ITableData";
import {ITableDefinition} from "../Table/ITableDefinition";
import {offs} from "../Blocks/kBlockHeaderField";
import {readNext} from "../Cursor/readNext";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readFirst} from "../Cursor/readFirst";
import {ITable} from "../Table/ITable";
import {rowHeaderSize} from "../Table/addRow";
import {compareRows} from "./compareRows";


export function isRowInSet(row1: DataView, table1: ITable, table1Def: ITableDefinition, table2: ITable, table2Def: ITableDefinition): { exists: boolean, info: { blockIndex: number, offset: number }[] } {
    let ret = { exists: false, info: [] };

    let cursor = readFirst(table2, table2Def);
    while (!cursorEOF(cursor)) {
        let row2 = new DataView(table2.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
        let flag = row2.getUint8(offs().DataRowFlag);
        const isDeleted = ((flag & offs().DataRowFlag_BitDeleted) === offs().DataRowFlag_BitDeleted) ? 1 : 0;
        if (isDeleted) {
            cursor = readNext(table2, table2Def, cursor);
            continue;
        }
        let rowExists = compareRows(row1, table1, table1Def, row2, table2, table2Def);
        if (rowExists === true) {
            ret.exists = true;
            ret.info.push({
                blockIndex: cursor.blockIndex,
                offset: cursor.offset
            });
        }

        cursor = readNext(table2, table2Def, cursor);
    }
    return ret;
}