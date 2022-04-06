import {SQLStatement} from "./SQLStatement";
import {SKSQL} from "./SKSQL";


// Update the table timestamp in sys_table_statistics
// this is called on CREATE/DELETE/UPDATE/INSERT

export function updateTableTimestamp(db: SKSQL, table: string) {
    if (table.startsWith("#")) {
        return;
    }
    if (!["DUAL", "ROUTINES", "SYS_TABLE_STATISTICS"].includes(table.toUpperCase())) {
        let st = new SQLStatement(db, "UPDATE sys_table_statistics SET table_timestamp = GETUTCDATE() WHERE table = @tableName");
        st.setParameter("@tableName", table.toUpperCase());
        st.run();
    }

}