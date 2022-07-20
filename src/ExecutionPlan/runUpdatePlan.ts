import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TEP} from "./TEP";
import {runScan} from "./runScan";
import {TEPScan} from "./TEPScan";
import {rowHeaderSize} from "../Table/addRow";
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
import {kModifiedBlockType, TExecutionContext} from "./TExecutionContext";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TParserError} from "../API/TParserError";
import {convertValue} from "../API/convertValue";
import {SKSQL} from "../API/SKSQL";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {readFirstColumnOfTable} from "../API/readFirstColumnOfTable";
import {TAlias} from "../Query/Types/TAlias";
import {TTable} from "../Query/Types/TTable";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {checkConstraint} from "./checkConstraint";
import {updateTableTimestamp} from "../API/updateTableTimestamp";
import {addModifiedBlockToContext} from "./addModifiedBlockToContext";


// Execute an execution plan for an UPDATE statement
// For each record that needs to be updated, we create a copy in a temp buffer
// update new columns in that temp buffer and check all constraints.
// Finally, the temp buffer is copied to the existing record.


export function runUpdatePlan(db: SKSQL, context: TExecutionContext,
                    statement: TQueryUpdate, ep: TEP[]) {

    let rowsModified = 0;
    let tableModified = undefined;
    let runCallback = function (tep: TEPScan | TEPNestedLoop, walkInfos: TTableWalkInfo[]) {


        if (tep.kind === "TEPScan") {

            let targetTable: TTableWalkInfo = undefined;
            if (statement.table !== undefined) {
                targetTable = walkInfos.find((t) => { return t.name.toUpperCase() === statement.table.table.toUpperCase();})
            } else {
                targetTable = walkInfos.find((t) => { return t.name.toUpperCase() === getValueForAliasTableOrLiteral(statement.tables[0].tableName as (TAlias | TTable)).table.toUpperCase();})
            }
            if (tableModified === undefined) {
                tableModified = targetTable.name.toUpperCase();
            }
            // mark the block as dirty
            let b = targetTable.table.data.blocks[targetTable.cursor.blockIndex];
            let blockDV = new DataView(b, 0, 25);
            blockDV.setUint8(kBlockHeaderField.BlockDirty, 1);

            // source row
            let dv = new DataView(b, targetTable.cursor.offset, targetTable.cursor.rowLength + rowHeaderSize );

            // write to a temp buffer
            // if no constraint errors happen,
            // we'll copy the content to the existing row
            let ab = new ArrayBuffer(targetTable.cursor.rowLength + rowHeaderSize);
            let row = new DataView(ab, 0, targetTable.cursor.rowLength + rowHeaderSize);
            copyBytesBetweenDV(targetTable.cursor.rowLength + rowHeaderSize, dv, row, 0, 0);

            for (let i = 0; i < statement.sets.length; i++) {
                let col = statement.sets[i].column

                let colDef = targetTable.def.columns.find((c) => { return c.name.toUpperCase() === statement.sets[i].column.column.toUpperCase();});
                if (colDef === undefined) {
                    throw new TParserError("Unknown column " + col.column);
                }
                let value = evaluate(db, context, statement.sets[i].value, walkInfos, colDef);
                if (instanceOfTTable(value)) {
                    value = readFirstColumnOfTable(db, context, value);
                }

                // Check if there's a NOT NULL constraint
                if (colDef.nullable === false && (value === undefined || value === null)) {
                    throw new TParserError("Error: Column " + colDef.name.toUpperCase() + " must not be NULL.");
                }

                let val2Write = convertValue(value, colDef.type);

                writeValue(targetTable.table, targetTable.def, colDef, row, val2Write, rowHeaderSize);
            }


            for (let i = 0; i < targetTable.def.constraints.length; i++) {
                let constraint = targetTable.def.constraints[i];
                checkConstraint(db, context, targetTable.table, targetTable.def, constraint, row, targetTable.cursor.rowLength + rowHeaderSize);
            }

            // we write the row to the block
            copyBytesBetweenDV(targetTable.cursor.rowLength, row, dv, rowHeaderSize, rowHeaderSize);

            addModifiedBlockToContext(context, kModifiedBlockType.tableBlock, targetTable.name, targetTable.cursor.blockIndex);


            rowsModified++;
            context.result.rowsModified += 1;
        }
        if (tep.kind === "TEPNestedLoop") {

        }

        if (statement.top !== undefined) {
            let topValue = evaluate(db, context, statement.top, [],  undefined);
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
            runScan(db, context, ps, context.tables, runCallback);
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
            let resultWI = context.tables.find((w) => { return w.name.toUpperCase() === ps.source.toUpperCase(); });
            bubbleSort(db, context, resultWI.table,resultWI.def, ps.orderBy);
            if (ps.top !== undefined) {
                let topValue = evaluate(db, context, ps.top, [], undefined);
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
    if (rowsModified > 0) {
        updateTableTimestamp(db, tableModified);
    }


}