import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TEP} from "./TEP";
import {runScan} from "./runScan";
import {TEPScan} from "./TEPScan";
import {addRow} from "../Table/addRow";
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



export function run(statement: TQuerySelect, ep: TEP[], parameters: {name: string, value: any}[], tables: TTableWalkInfo[]): SQLResult {
    let returnTable = "";
    let rowsModified = 0;
    let ret: SQLResult = undefined;
    let runCallback = function (tep: TEPScan | TEPNestedLoop, walkInfos: TTableWalkInfo[]) {
        let resultWI: TTableWalkInfo = undefined;
        if (tep.kind === "TEPScan") {
            resultWI = walkInfos.find((w) => { return w.name.toUpperCase() === tep.result.toUpperCase(); });
        } else if (tep.kind === "TEPNestedLoop") {
            resultWI = walkInfos.find((w) => { return w.name.toUpperCase() === tep.a.result.toUpperCase(); });
        }
        returnTable = resultWI.name;
        let row = addRow(resultWI.table.data, 4096);
        let columns = resultWI.def.columns;
        if (tep.kind === "TEPScan") {
            for (let i = 0; i < columns.length; i++) {
                let value = evaluate(tep.output[i].expression, parameters, tables, columns[i]);
                writeValue(resultWI.table, resultWI.def, columns[i], row, value, 0);
            }
        }
        if (tep.kind === "TEPNestedLoop") {
            for (let i = 0; i < columns.length; i++) {
                let value = evaluate(tep.a.output[i].expression, parameters, tables, columns[i]);
                writeValue(resultWI.table, resultWI.def, columns[i], row, value, 0);
            }
        }
        rowsModified++;
        if (statement.top !== undefined) {
            if (statement.orderBy === undefined || statement.orderBy.length === 0 || (statement.orderBy.length > 0 && instanceOfTLiteral(statement.orderBy[0].column) && statement.orderBy[0].column.value === "ROWID")) {
                let topValue = evaluate(statement.top, parameters, tables, undefined);
                if (isNumeric(topValue) && topValue.m <= rowsModified) {
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
            runScan(ps, parameters, tables, runCallback);
        }
        if (p.kind === "TEPNestedLoop") {
            let ps = p as TEPNestedLoop;
            runNestedLoop(ps, parameters, tables, runCallback);
        }
        if (p.kind === "TEPSortNTop") {
            let ps = p as TEPSortNTop;
            let resultWI = tables.find((w) => { return w.name.toUpperCase() === ps.source.toUpperCase(); });
            bubbleSort(resultWI.table,resultWI.def, ps.orderBy);
            if (ps.top !== undefined) {
                let topValue = evaluate(ps.top, parameters, tables, undefined);
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
            ret = {
                resultTableName: ps.dest,
                error: undefined,
                rowCount: rowsModified
            };
        }
    }
    return ret;


}