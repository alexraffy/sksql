import {SQLStatement} from "./SQLStatement";
import {SKSQL} from "./SKSQL";
import {readFirst} from "../Cursor/readFirst";
import {readValue} from "../BlockIO/readValue";
import {rowHeaderSize} from "../Table/addRow";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {readNext} from "../Cursor/readNext";
import {writeValue} from "../BlockIO/writeValue";
import {TDateTime} from "../Query/Types/TDateTime";
import {date_getutcdate} from "../Functions/Date/date_getutcdate";


// Update the table timestamp in sys_table_statistics
// this is called on CREATE/DELETE/UPDATE/INSERT

export function updateTableTimestamp(db: SKSQL, table: string) {
    if (table.startsWith("#")) {
        return;
    }
    if (!["DUAL", "ROUTINES", "SYS_TABLE_STATISTICS"].includes(table.toUpperCase())) {

        //let st = new SQLStatement(db, "UPDATE sys_table_statistics SET table_timestamp = GETUTCDATE() WHERE table = @tableName");
        //st.setParameter("@tableName", table.toUpperCase());
        //st.run();

        let tableUppercase = table.toUpperCase();
        let tbl = db.tableInfo.get("sys_table_statistics");
        let colName = tbl.def.columns.find((c) => { return c.name.toUpperCase() === "TABLE";});
        let colTimestamp = tbl.def.columns.find((c) => { return c.name.toUpperCase() === "TABLE_TIMESTAMP";});
        let cursor = readFirst(tbl.pointer, tbl.def);
        while (cursor.offset !== -1) {
            let dv = new DataView(tbl.pointer.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
            let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
            const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
            if (isDeleted) {
                cursor = readNext(tbl.pointer, tbl.def, cursor);
                continue;
            }
            let tableValue = readValue(tbl.pointer, tbl.def, colName, dv, rowHeaderSize, tableUppercase);
            if (tableValue === tableUppercase) {
                let now = new Date();
                let value: TDateTime = date_getutcdate(undefined) as TDateTime;
                writeValue(tbl.pointer, tbl.def, colTimestamp, dv, value, rowHeaderSize);
                return;
            }
            cursor = readNext(tbl.pointer, tbl.def, cursor);
        }

    }

}