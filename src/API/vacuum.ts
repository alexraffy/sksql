import {SKSQL} from "./SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {newTable} from "../Table/newTable";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {addRow, rowHeaderSize} from "../Table/addRow";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {writeStringToUtf8ByteArray} from "../BlockIO/writeStringToUtf8ByteArray";


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
    dvDestHeader.setUint32(kBlockHeaderField.TableDefIdentityValue, def.identityValue);


    try {
        // lock the source table for writing
        let srcFlag1 = dvSourceHeader.getUint8(kBlockHeaderField.TableDefFlag1);
        srcFlag1 = kBlockHeaderField.TableDefFlag1_BitOK | kBlockHeaderField.TableDefFlag1_BitWriteLocked;
        dvSourceHeader.setUint8(kBlockHeaderField.TableDefFlag1, srcFlag1);
        // lock the dest table for reading
        let dstFlag1 = dvDestHeader.getUint32(kBlockHeaderField.TableDefFlag1);
        dstFlag1 = dstFlag1 | kBlockHeaderField.TableDefFlag1_BitWriteLocked | kBlockHeaderField.TableDefFlag1_BitReadLocked;
        dvDestHeader.setUint8(kBlockHeaderField.TableDefFlag1, dstFlag1);

        // copy rows
        let cursor = readFirst(table, def);
        while (!cursorEOF(cursor)) {
            let dv = new DataView(table.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
            let rowFlag = dv.getUint8(kBlockHeaderField.DataRowFlag);
            const isDeleted = ((rowFlag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
            if (isDeleted) {
                cursor = readNext(table, def, cursor);
                continue;
            }
            let row = addRow(nt.data, table.data.blocks[0].byteLength);
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
        srcFlag1 = kBlockHeaderField.TableDefFlag1_BitOK | kBlockHeaderField.TableDefFlag1_BitWriteLocked | kBlockHeaderField.TableDefFlag1_BitReadLocked;
        dvSourceHeader.setUint8(kBlockHeaderField.TableDefFlag1, srcFlag1);
        // delete the table
        // this will delete table data when run server-side
        allLocked = true;
        db.dropTable(tableName);
        allLocked = false;

        // rename the table
        writeStringToUtf8ByteArray(dvDestHeader, kBlockHeaderField.TableDefTableName, def.name.replace("@", ""), 255);
        dvDestHeader.setUint8(kBlockHeaderField.TableDefFlag1, kBlockHeaderField.TableDefFlag1_BitOK);
        db.tableInfo.syncAll();

    } catch (e) {


    }

}