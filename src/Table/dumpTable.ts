import {ITableData} from "./ITableData";
import {readTableDefinition} from "./readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {recordSize} from "./recordSize";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {TableColumnType} from "./TableColumnType";
import {readStringFromUtf8Array} from "../BlockIO/readStringFromUtf8Array";
import {ITable} from "./ITable";
import {readValue} from "../BlockIO/readValue";
import {numeric} from "../Numeric/numeric";
import {numericDisplay} from "../Numeric/numericDisplay";
import {isNumeric} from "../Numeric/isNumeric";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {TDate} from "../Query/Types/TDate";
import {padLeft} from "../Date/padLeft";

/*
    returns a string representation of all the rows (active AND deleted)  in the table
 */
export function dumpTable(table: ITable) {
    let ret: string = "";
    let def = readTableDefinition(table.data);
    let cursor = readFirst(table, def);
    let record = recordSize(table.data);
    ret = "ID\tFLAG\t";
    for (let i = 0; i < def.columns.length; i ++) {
        ret += def.columns[i].name + "\t";
    }
    ret += "\n";
    while (!cursorEOF(cursor)) {
        let dv = new DataView(table.data.blocks[cursor.blockIndex], cursor.offset, record + 5);
        let id = dv.getUint32(0);
        let flag = dv.getUint8(4);
        ret += id + "\t" + flag + "\t";
        for (let x = 0; x < def.columns.length; x++) {
            let type = def.columns[x].type;
            let len = def.columns[x].length;
            let coffset = def.columns[x].offset
            let value: string | number | bigint | boolean | numeric | TDate = readValue(table, def, def.columns[x], dv);
            if (isNumeric(value)) {
                ret += numericDisplay(value) + "\t";
            } else if (instanceOfTDate(value)) {
                ret += padLeft(value.year.toString(), 4, "0") + "-" + padLeft(value.month.toString(), 2, "0") + "-" + padLeft(value.day.toString(), 2, "0") + "\t";
            } else {
                ret += value + "\t";
            }
        }
        ret += "\n";

        readNext(table, def, cursor);
    }

    return ret;
}