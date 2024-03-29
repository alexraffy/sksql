import {SKSQL} from "./SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {newTable} from "../Table/newTable";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {addRow, rowHeaderSize} from "../Table/addRow";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {writeStringToUtf8ByteArray} from "../BlockIO/writeStringToUtf8ByteArray";
import {createNewContext} from "../ExecutionPlan/newContext";
import {offs} from "../Blocks/kBlockHeaderField";

// Remove deleted rows from a table


export function vacuumTable(db: SKSQL, tableName: string, cbWriteTable: (tableName, cb) => void) {
    let allLocked = false;

    let table = db.getTable(tableName);
    let def = readTableDefinition(table.data, true);

    let blkSourceHeader = table.data.tableDef;
    let dvSourceHeader = new DataView(blkSourceHeader);

    def.name = "@" +def.name;
    let nt = newTable(db, def);
    let blkDestHeader = nt.data.tableDef;
    let dvDestHeader = new DataView(blkDestHeader);
    dvDestHeader.setUint32(offs().TableDefIdentityValue, def.identityValue);


    try {
        // lock the source table for writing
        let srcFlag1 = dvSourceHeader.getUint8(offs().TableDefFlag1);
        srcFlag1 = offs().TableDefFlag1_BitOK | offs().TableDefFlag1_BitWriteLocked;
        dvSourceHeader.setUint8(offs().TableDefFlag1, srcFlag1);
        // lock the dest table for reading
        let dstFlag1 = dvDestHeader.getUint32(offs().TableDefFlag1);
        dstFlag1 = dstFlag1 | offs().TableDefFlag1_BitWriteLocked | offs().TableDefFlag1_BitReadLocked;
        dvDestHeader.setUint8(offs().TableDefFlag1, dstFlag1);

        // copy rows
        let cursor = readFirst(table, def);
        while (!cursorEOF(cursor)) {
            let dv = new DataView(table.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
            let rowFlag = dv.getUint8(offs().DataRowFlag);
            const isDeleted = ((rowFlag & offs().DataRowFlag_BitDeleted) === offs().DataRowFlag_BitDeleted) ? 1 : 0;
            if (isDeleted || rowFlag === 1) {
                cursor = readNext(table, def, cursor);
                continue;
            }
            let nc = createNewContext("", "", undefined);
            let row = addRow(nt.data, table.data.blocks[0].byteLength, nc);
            copyBytesBetweenDV(cursor.rowLength, dv, row, rowHeaderSize, rowHeaderSize);
            cursor = readNext(table, def, cursor);
        }

        cbWriteTable(def.name, () => {
            try {


            } finally {
                if (allLocked === true) {

                }
            }

        });
        // lock the source table for reading
        srcFlag1 = offs().TableDefFlag1_BitOK | offs().TableDefFlag1_BitWriteLocked | offs().TableDefFlag1_BitReadLocked;
        dvSourceHeader.setUint8(offs().TableDefFlag1, srcFlag1);
        // delete the table
        // this will delete table data when run server-side
        allLocked = true;
        db.dropTable(tableName);
        allLocked = false;

        // rename the table
        writeStringToUtf8ByteArray(dvDestHeader, offs().TableDefTableName, def.name.replace("@", ""), 255);
        dvDestHeader.setUint8(offs().TableDefFlag1, offs().TableDefFlag1_BitOK);
        db.tableInfo.syncAll();

    } catch (e) {


    }

}