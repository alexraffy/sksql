



import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TEP} from "./TEP";
import {runScan} from "./runScan";
import {TEPScan} from "./TEPScan";
import {addRow, rowHeaderSize} from "../Table/addRow";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TEPNestedLoop} from "./TEPNestedLoop";
import {runNestedLoop} from "./runNestedLoop";
import {evaluate} from "../API/evaluate";
import {writeValue} from "../BlockIO/writeValue";
import {TEPSortNTop} from "./TEPSortNTop";
import {bubbleSort} from "../Sort/bubbleSort";
import {TEPSelect} from "./TEPSelect";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {isNumeric} from "../Numeric/isNumeric";
import {TEPGroupBy} from "./TEPGroupBy";
import {runGroupBy} from "./runGroupBy";
import {TExecutionContext} from "./TExecutionContext";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TParserError} from "../API/TParserError";
import {convertValue} from "../API/convertValue";
import {SKSQL} from "../API/SKSQL";



export function runUpdatePlan(db: SKSQL, context: TExecutionContext,
                    statement: TQueryUpdate, ep: TEP[]) {

    let rowsModified = 0;
    let runCallback = function (tep: TEPScan | TEPNestedLoop, walkInfos: TTableWalkInfo[]) {


        if (tep.kind === "TEPScan") {

            for (let i = 0; i < statement.sets.length; i++) {
                let col = statement.sets[i].column
                let targetTable: TTableWalkInfo = undefined;
                if (statement.table !== undefined) {
                    targetTable = walkInfos.find((t) => { return t.name.toUpperCase() === statement.table.table.toUpperCase();})
                } else {
                    targetTable = walkInfos.find((t) => { return t.name.toUpperCase() === getValueForAliasTableOrLiteral(statement.tables[0].tableName).table.toUpperCase();})
                }

                let colDef = targetTable.def.columns.find((c) => { return c.name.toUpperCase() === statement.sets[i].column.column.toUpperCase();});
                if (colDef === undefined) {
                    throw new TParserError("Unknown column " + col.column);
                }
                let value = evaluate(db, context, statement.sets[i].value, colDef);
                let val2Write = convertValue(value, colDef.type);
                let b = targetTable.table.data.blocks[targetTable.cursor.blockIndex];
                let blockDV = new DataView(b, 0, 25);
                blockDV.setUint8(kBlockHeaderField.BlockDirty, 1);
                let dv = new DataView(b, targetTable.cursor.offset, targetTable.cursor.rowLength + rowHeaderSize );
                writeValue(targetTable.table, targetTable.def, colDef, dv, val2Write, rowHeaderSize);
            }
            context.result.rowsModified += 1;
        }
        if (tep.kind === "TEPNestedLoop") {

        }

        if (statement.top !== undefined) {
            let topValue = evaluate(db, context, statement.top, undefined);
            if ((typeof topValue === "number" && topValue <= rowsModified) || (isNumeric(topValue) && topValue.m <= rowsModified))  {
                return false;
            }

        }

        return true;
    }

    for (let i = 0; i < ep.length; i++) {
        let p = ep[i];
        if (p.kind === "TEPScan") {
            let ps = p as TEPScan;
            runScan(db, context, ps, runCallback);
        }
        if (p.kind === "TEPNestedLoop") {
            let ps = p as TEPNestedLoop;
            runNestedLoop(db, context, ps, runCallback);
        }
        if (p.kind === "TEPGroupBy") {
            let ps = p as TEPGroupBy;
            runGroupBy(db, context, ps, (tep, walkInfos) => {

                return true;
            })
        }
        if (p.kind === "TEPSortNTop") {
            let ps = p as TEPSortNTop;
            let resultWI = context.openTables.find((w) => { return w.name.toUpperCase() === ps.source.toUpperCase(); });
            bubbleSort(resultWI.table,resultWI.def, ps.orderBy);
            if (ps.top !== undefined) {
                let topValue = evaluate(db, context, ps.top, undefined);
                if (isNumeric(topValue)) {
                    let curs = readFirst(resultWI.table, resultWI.def);
                    let num = 0;
                    while (!cursorEOF(curs)) {
                        num++;
                        if (num>topValue.m) {
                            let dv = new DataView(resultWI.table.data.blocks[curs.blockIndex]);
                            dv.setUint32(kBlockHeaderField.DataEnd, curs.offset);
                            dv.setUint32(kBlockHeaderField.NumRows, num);
                            break;
                        }
                        curs = readNext(resultWI.table, resultWI.def, curs);
                    }

                }
            }
        }
        if (p.kind === "TEPSelect") {
            let ps = p as TEPSelect;

        }
    }



}