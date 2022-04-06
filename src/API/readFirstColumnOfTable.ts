import {TTable} from "../Query/Types/TTable";
import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {SKSQL} from "./SKSQL";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {TableColumn} from "../Table/TableColumn";
import {readValue} from "../BlockIO/readValue";
import {rowHeaderSize} from "../Table/addRow";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";

// return the first column of the first row in a table
export function readFirstColumnOfTable(db: SKSQL, context: TExecutionContext, t: TTable): string | boolean | number | numeric | TDate | TDateTime | TTime | bigint {

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

    let cursor = readFirst(tbl, def);
    if (!cursorEOF(cursor)) {
        let dv = new DataView(tbl.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
        for (let i = 0; i < def.columns.length; i++) {
            let c = def.columns[i];
            if (c.invisible === undefined || c.invisible === false) {
                return readValue(tbl, def, c, dv, rowHeaderSize);
                break;
            }
        }
    }
    return undefined;

}