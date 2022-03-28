import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {SKSQL} from "./SKSQL";
import {TTable} from "../Query/Types/TTable";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {rowHeaderSize} from "../Table/addRow";
import {readValue} from "../BlockIO/readValue";
import {readNext} from "../Cursor/readNext";


export function readAllFirstColumns(db: SKSQL, context: TExecutionContext, t: TTable): (string | boolean | number | numeric | TDate | TDateTime | TTime | bigint)[] {


    let tbl: ITable;
    let def: ITableDefinition;

    let ot = db.tableInfo.get(t.table);
    if (ot !== undefined) {
        tbl = ot.pointer;
        def = ot.def;
    } else {
        tbl = db.getTable(t.table);
        def = readTableDefinition(tbl.data, false);
    }
    let ret = [];

    let cursor = readFirst(tbl, def);
    while (!cursorEOF(cursor)) {
        let dv = new DataView(tbl.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
        for (let i = 0; i < def.columns.length; i++) {
            let c = def.columns[i];
            if (c.invisible === undefined || c.invisible === false) {
                ret.push(readValue(tbl, def, c, dv, rowHeaderSize));
                break;
            }
        }
        cursor = readNext(tbl, def, cursor);
    }
    return ret;

}