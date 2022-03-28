import {TEPScan} from "./TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {SKSQL} from "../API/SKSQL";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {TExecutionContext} from "./TExecutionContext";
import {findWalkTable} from "./findWalkTable";
import {kBooleanResult} from "../API/kBooleanResult";
import {evaluate} from "../API/evaluate";
import {TBooleanResult} from "../API/TBooleanResult";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";


export function runScan(db: SKSQL, context: TExecutionContext,
                        tep: TEPScan,
                        tables: TTableWalkInfo[],
                        onRowSelected: (scan: TEPScan, tables: TTableWalkInfo[]) => boolean) {
    let tableName = getValueForAliasTableOrLiteral(tep.table);
    let tblInfo = db.tableInfo.get(tableName.table);

    let walk = findWalkTable(tables, tep.table);
    /*
    {
        name: tableName.table.toUpperCase(),
        alias: tableName.alias.toUpperCase(),
        table: tblInfo.pointer,
        def: tblInfo.def,
        cursor: undefined,
        rowLength: recordSize(tblInfo.pointer.data) +  rowHeaderSize
    } as TTableWalkInfo;

     */

    walk.cursor = readFirst(walk.table, walk.def);
    while (!cursorEOF(walk.cursor)) {
        //console.log(tblDef.name + " blk: " + walk.cursor.blockIndex + ":" + walk.cursor.offset);
        let b = walk.table.data.blocks[walk.cursor.blockIndex];
        let dv = new DataView(b, walk.cursor.offset, walk.rowLength);
        let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
        const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
        if (isDeleted) {
            walk.cursor = readNext(walk.table, walk.def, walk.cursor);
            continue;
        }
        let selectRow: TBooleanResult = {kind: "TBooleanResult", value: kBooleanResult.isTrue};
        if (tep.predicate !== undefined) {
            selectRow = evaluate(db, context, tep.predicate, tables, undefined, {currentStep: tep, aggregateObjects: [], aggregateMode: "none"}) as TBooleanResult;
        }
        if (instanceOfTBooleanResult(selectRow) && selectRow.value === kBooleanResult.isTrue || ((typeof selectRow === "boolean") && selectRow === true)) {
            let ret = onRowSelected(tep, [walk, ...tables]);
            if (ret === false){
                break;
            }
        }
        walk.cursor = readNext(walk.table, walk.def, walk.cursor);
    }



}