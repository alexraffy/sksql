import {TEPScan} from "./TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {DBData} from "../API/DBInit";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {evaluateBooleanClauseWithRow} from "../API/evaluateBooleanClauseWithRow";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {evaluateWhereClause} from "../API/evaluateWhereClause";


export function runScan(tep: TEPScan, parameters: {name: string, value: any}[], tables: TTableWalkInfo[], onRowSelected: (scan: TEPScan, walking: TTableWalkInfo[]) => boolean) {
    let tableName = getValueForAliasTableOrLiteral(tep.table);
    let walk = tables.find((w) => { return w.name.toUpperCase() === tableName.table.toUpperCase();})
    let tbl = walk.table;
    let tblDef = walk.def;
    const rowLength = walk.rowLength;

    walk.cursor = readFirst(tbl, tblDef);
    while (!cursorEOF(walk.cursor)) {
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
            selectRow = evaluateWhereClause(tep.predicate, parameters, tables);
        }
        if (selectRow) {
            let ret = onRowSelected(tep, tables);
            if (ret === false){
                break;
            }
        }
        walk.cursor = readNext(tbl, tblDef, walk.cursor);
    }



}