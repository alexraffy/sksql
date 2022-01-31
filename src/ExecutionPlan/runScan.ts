import {TEPScan} from "./TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {evaluateWhereClause} from "../API/evaluateWhereClause";
import {TableColumnType} from "../Table/TableColumnType";
import {TExecutionContext} from "./TExecutionContext";


export function runScan(context: TExecutionContext,
                        tep: TEPScan,
                        onRowSelected: (scan: TEPScan, walking: TTableWalkInfo[]) => boolean) {
    let tableName = getValueForAliasTableOrLiteral(tep.table);
    let walk = context.openTables.find((w) => { return w.name.toUpperCase() === tableName.table.toUpperCase();})
    let tbl = walk.table;
    let tblDef = walk.def;
    const rowLength = walk.rowLength;

    walk.cursor = readFirst(tbl, tblDef);
    while (!cursorEOF(walk.cursor)) {
        //console.log(tblDef.name + " blk: " + walk.cursor.blockIndex + ":" + walk.cursor.offset);
        let b = tbl.data.blocks[walk.cursor.blockIndex];
        let dv = new DataView(b, walk.cursor.offset, rowLength);
        let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
        const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
        if (isDeleted) {
            walk.cursor = readNext(tbl, tblDef, walk.cursor);
            continue;
        }
        let selectRow = true;
        if (tep.predicate !== undefined) {
            selectRow = evaluateWhereClause(context, tep.predicate);
        }
        if (selectRow) {
            let ret = onRowSelected(tep, context.openTables);
            if (ret === false){
                break;
            }
        }
        walk.cursor = readNext(tbl, tblDef, walk.cursor);
    }



}