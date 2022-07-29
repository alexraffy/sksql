import {readTableDefinition} from "../Table/readTableDefinition";
import {SKSQL} from "./SKSQL";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {rowHeaderSize} from "../Table/addRow";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {readNext} from "../Cursor/readNext";
import {SQLStatement} from "./SQLStatement";
import {kResultType} from "./kResultType";



// Gather information about a table and update sys_table_statistics

export function genStatsForTable(db: SKSQL, tableName: string): number {
    if (tableName.startsWith("#")) {
        return 0;
    }

    let table = db.getTable(tableName);
    if (table === undefined) {
        let sql = "DELETE TOP(1) FROM sys_table_statistics WHERE table = @tableName";
        let stDelete = new SQLStatement(db, sql, false);
        stDelete.setParameter("@tableName", tableName.toUpperCase());
        try {
            stDelete.runSync();
        } catch (eDelete) {
            return;
        }
        stDelete.close();
        return 0;
    }


    let def = readTableDefinition(table.data, true);

    let activeRows: number = 0;
    let deadRows: number = 0;
    let headerBlockSize: number = table.data.tableDef.byteLength;
    let totalDataBlocksSize : number = 0;
    let largestDataBlockSize: number = 0;

    for (let i = 0; i < table.data.blocks.length; i++) {
        if (table.data.blocks[i].byteLength > largestDataBlockSize) {
            largestDataBlockSize = table.data.blocks[i].byteLength;
        }
        totalDataBlocksSize += table.data.blocks[i].byteLength;
    }


    let cursor = readFirst(table, def);
    while (!cursorEOF(cursor)) {
        let dv = new DataView(table.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
        let rowFlag = dv.getUint8(kBlockHeaderField.DataRowFlag);
        const isDeleted = ((rowFlag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
        if (isDeleted) {
            deadRows++;
            cursor = readNext(table, def, cursor);
            continue;
        }
        activeRows++;

        cursor = readNext(table, def, cursor);
    }
    let id = 0;
    let sql = "SELECT TOP(1) id FROM sys_table_statistics WHERE UPPER(table) = UPPER(@tableName);";
    let stExists = new SQLStatement(db, sql, false);
    stExists.setParameter("@tableName", tableName);
    let ret = stExists.runSync();
    let retExists = ret.getRows();
    stExists.close();
    if (retExists !== undefined && retExists.length === 1) {
        id = retExists[0]["id"];
        let sqlUpdate = "UPDATE sys_table_statistics SET timestamp = GETUTCDATE(), active_rows = @active_rows, dead_rows = @dead_rows, header_size = @header_size, total_size = @total_size, largest_block_size = @largest_block_size WHERE id = @id"
        let stUpdate = new SQLStatement(db, sqlUpdate, false);
        stUpdate.setParameter("@active_rows", activeRows);
        stUpdate.setParameter("@dead_rows", deadRows);
        stUpdate.setParameter("@header_size", headerBlockSize);
        stUpdate.setParameter("@total_size", totalDataBlocksSize);
        stUpdate.setParameter("@largest_block_size", largestDataBlockSize);
        stUpdate.setParameter("@id", id);
        stUpdate.runSync();
        stUpdate.close();
    } else {
        let sqlInsert = "INSERT INTO sys_table_statistics(timestamp, table, active_rows, dead_rows, header_size, total_size, largest_block_size, table_timestamp) VALUES (GETUTCDATE(), @tableName, @active_rows, @dead_rows, @header_size, @total_size, @largest_block_size, GETUTCDATE())";
        let stInsert = new SQLStatement(db, sqlInsert, false);
        stInsert.setParameter("@tableName", tableName.toUpperCase());
        stInsert.setParameter("@active_rows", activeRows);
        stInsert.setParameter("@dead_rows", deadRows);
        stInsert.setParameter("@header_size", headerBlockSize);
        stInsert.setParameter("@total_size", totalDataBlocksSize);
        stInsert.setParameter("@largest_block_size", largestDataBlockSize);
        stInsert.runSync();
        stInsert.close();
        id = stInsert.context.scopedIdentity;
    }


    return id;


}