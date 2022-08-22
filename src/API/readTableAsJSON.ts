import {SKSQL} from "./SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {readValue} from "../BlockIO/readValue";
import { isNumeric } from "../Numeric/isNumeric";
import { instanceOfTDate } from "../Query/Guards/instanceOfTDate";
import { padLeft } from "../Date/padLeft";
import { numericToNumber } from "../Numeric/numericToNumber";
import {offs} from "../Blocks/kBlockHeaderField";

// Read a table and return a JSON array of JSON dictionaries

export function readTableAsJSON(db: SKSQL, table: string): any[] {
    let ret: any[] = [];
    let tbl = db.tableInfo.get(table);
    if (tbl === undefined) { return ret; }
    let cursor = readFirst(tbl.pointer, tbl.def);
    while (!cursorEOF(cursor)) {
        let row = {};
        let dv = new DataView(tbl.pointer.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + 5);

        let flag = dv.getUint8(offs().DataRowFlag);
        const isDeleted = ((flag & offs().DataRowFlag_BitDeleted) === offs().DataRowFlag_BitDeleted) ? 1 : 0;
        if (isDeleted == 0) {
            for (let i = 0; i < tbl.def.columns.length; i++) {
                if (tbl.def.columns[i].invisible !== true) {
                    let val = readValue(tbl.pointer, tbl.def, tbl.def.columns[i], dv, 5);
                    if (isNumeric(val)) {
                        row[tbl.def.columns[i].name] = val; //numericToNumber(val);
                    } else if (instanceOfTDate(val)) {
                        // TODO check return option
                        row[tbl.def.columns[i].name] = val;
                        // row[tbl.def.columns[i].name] = new Date(val.year + "-" + padLeft(val.month, 2, "0") + "-" + padLeft(val.month, 2, "0"));
                    } else {
                        row[tbl.def.columns[i].name] = val;
                    }
                }
            }
            ret.push(row);
        }
        cursor = readNext(tbl.pointer, tbl.def, cursor);
    }
    return ret;
}