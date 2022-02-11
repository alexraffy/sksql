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
import {SQLResult} from "../API/SQLResult";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {isNumeric} from "../Numeric/isNumeric";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TEPGroupBy} from "./TEPGroupBy";
import {runGroupBy} from "./runGroupBy";
import {TableColumnType} from "../Table/TableColumnType";
import {TExecutionContext} from "./TExecutionContext";
import {SKSQL} from "../API/SKSQL";



export function run(db: SKSQL, context: TExecutionContext,
                    statement: TQuerySelect, ep: TEP[]) {
    let returnTable = "";
    let rowsModified = 0;
    let runCallback = function (tep: TEPScan | TEPNestedLoop, walkInfos: TTableWalkInfo[]) {
        let resultWI: TTableWalkInfo = undefined;
        if (tep.kind === "TEPScan") {
            resultWI = walkInfos.find((w) => { return w.name.toUpperCase() === tep.result.toUpperCase(); });
        } else if (tep.kind === "TEPNestedLoop") {
            resultWI = walkInfos.find((w) => { return w.name.toUpperCase() === tep.a.result.toUpperCase(); });
        }
        returnTable = resultWI.name;
        let lenNewBuffer = 4096;
        while (resultWI.rowLength > lenNewBuffer) {
            lenNewBuffer = lenNewBuffer * 2;
        }
        let row = addRow(resultWI.table.data, lenNewBuffer);
        let columns = resultWI.def.columns;
        if (tep.kind === "TEPScan") {
            for (let i = 0; i < tep.projection.length; i++) {
                let col = columns.find((t) => { return t.name.toUpperCase() === tep.projection[i].columnName.toUpperCase();});
                if (col !== undefined) {
                    let value = evaluate(db, context, tep.projection[i].output, col);
                    writeValue(resultWI.table, resultWI.def, col, row, value, rowHeaderSize);
                }
            }
        }
        if (tep.kind === "TEPNestedLoop") {
            for (let i = 0; i < tep.a.projection.length; i++) {
                let col = columns.find((t) => { return t.name.toUpperCase() === tep.a.projection[i].columnName.toUpperCase();});
                if (col !== undefined) {
                    let value = evaluate(db, context, tep.a.projection[i].output, col);
                    writeValue(resultWI.table, resultWI.def, col, row, value, rowHeaderSize);
                }
            }
        }
        rowsModified++;
        if (statement.top !== undefined) {
            if (statement.orderBy === undefined || statement.orderBy.length === 0 || (statement.orderBy.length > 0 && instanceOfTLiteral(statement.orderBy[0].column) && statement.orderBy[0].column.value === "ROWID")) {
                let topValue = evaluate(db, context, statement.top, undefined);
                if ((typeof topValue === "number" && topValue <= rowsModified) || (isNumeric(topValue) && topValue.m <= rowsModified)) {
                    return false;
                }
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
                let n = 0;
                if (typeof topValue === "number") {
                    n = topValue;
                } else if (isNumeric(topValue)) {
                    n = topValue.m;
                }

                let curs = readFirst(resultWI.table, resultWI.def);
                let num = 0;
                while (!cursorEOF(curs)) {
                    num++;
                    if (num>n) {
                        let dv = new DataView(resultWI.table.data.blocks[curs.blockIndex]);
                        dv.setUint32(kBlockHeaderField.DataEnd, curs.offset);
                        dv.setUint32(kBlockHeaderField.NumRows, num);
                        break;
                    }
                    curs = readNext(resultWI.table, resultWI.def, curs);
                }


            }
        }
        if (p.kind === "TEPSelect") {
            let ps = p as TEPSelect;
            context.result.resultTableName = ps.dest;
            context.result.rowCount = rowsModified;
        }
    }



}