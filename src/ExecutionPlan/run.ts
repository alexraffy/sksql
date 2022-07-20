import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TExecutionPlan} from "./TEP";
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
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TEPGroupBy} from "./TEPGroupBy";
import {runGroupBy} from "./runGroupBy";
import {TExecutionContext} from "./TExecutionContext";
import {kDebugLevel, SKSQL} from "../API/SKSQL";
import {readFirstColumnOfTable} from "../API/readFirstColumnOfTable";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {recordSize} from "../Table/recordSize";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";
import {kBooleanResult} from "../API/kBooleanResult";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {compareBytesBetweenDV} from "../BlockIO/compareBytesBetweenDV";
import {processSelectStatement} from "./processSelectStatement";
import {createNewContext} from "./newContext";
import {TTable} from "../Query/Types/TTable";
import {readTableDefinition} from "../Table/readTableDefinition";
import {kUnionType} from "../Query/Enums/kUnionType";
import {isRowInSet} from "./isRowInSet";
import {copyRow} from "../BlockIO/copyRow";
import {TParserError} from "../API/TParserError";
import {addTempTablesToContext} from "./addTempTablesToContext";
import {addModifiedBlockToContext} from "./addModifiedBlockToContext";
import {addModifiedBlocksToContext} from "./addModifiedBlocksToContext";


// Run an execution plan.



export function run(db: SKSQL, context: TExecutionContext,
                    statement: TQuerySelect, execPlan: TExecutionPlan) {
    let returnTable = "";
    let rowsModified = 0;
    let runCallback = function (tep: TEPScan | TEPNestedLoop, walkInfos: TTableWalkInfo[]) {



        let resultWI: TTableWalkInfo = undefined;
        let hasDistinct: boolean = statement.hasDistinct;
        if (tep.kind === "TEPScan") {
            resultWI = walkInfos.find((w) => { return w.name.toUpperCase() === tep.result.toUpperCase(); });
        } else if (tep.kind === "TEPNestedLoop") {
            resultWI = walkInfos.find((w) => { return w.name.toUpperCase() === tep.a.result.toUpperCase(); });
        }
        returnTable = resultWI.name;
        let lenNewBuffer = 65536;
        while (resultWI.rowLength > lenNewBuffer) {
            lenNewBuffer = lenNewBuffer * 2;
        }


        // let row = addRow(resultWI.table.data, lenNewBuffer);
        // write to a temp buffer
        // if distinct is specified we'll have to check if a row already exists with the same data
        // we'll copy the content to a new row after
        let ab = new ArrayBuffer(resultWI.cursor.rowLength + rowHeaderSize);
        let row = new DataView(ab, 0, resultWI.cursor.rowLength + rowHeaderSize);


        let columns = resultWI.def.columns;
        if (tep.kind === "TEPScan") {
            for (let i = 0; i < tep.projection.length; i++) {
                let col = columns.find((t) => { return t.name.toUpperCase() === tep.projection[i].columnName.toUpperCase();});
                if (col !== undefined) {
                    let value = evaluate(db, context, tep.projection[i].output, walkInfos, col, {currentStep: tep, aggregateMode: "none", aggregateObjects: []});
                    if (instanceOfTTable(value)) {
                        value = readFirstColumnOfTable(db, context, value);
                    }
                    if (instanceOfTBooleanResult(value)) {
                        value = value.value === kBooleanResult.isTrue;
                    }
                    writeValue(resultWI.table, resultWI.def, col, row, value, rowHeaderSize);
                }
            }
        }
        if (tep.kind === "TEPNestedLoop") {
            for (let i = 0; i < tep.a.projection.length; i++) {
                let col = columns.find((t) => { return t.name.toUpperCase() === tep.a.projection[i].columnName.toUpperCase();});
                if (col !== undefined) {
                    let value = evaluate(db, context, tep.a.projection[i].output, context.tables, col, {currentStep: tep, aggregateMode: "none", aggregateObjects: []});
                    if (instanceOfTTable(value)) {
                        value = readFirstColumnOfTable(db, context, value);
                    }
                    if (instanceOfTBooleanResult(value)) {
                        value = value.value === kBooleanResult.isTrue;
                    }
                    writeValue(resultWI.table, resultWI.def, col, row, value, rowHeaderSize);
                }
            }
        }
        let writeRow = true;
        if (hasDistinct) {
            let distinctCursor = readFirst(resultWI.table, resultWI.def);
            while (!cursorEOF(distinctCursor)) {
                let existingRow = new DataView(resultWI.table.data.blocks[distinctCursor.blockIndex], distinctCursor.offset, distinctCursor.rowLength + rowHeaderSize);
                if (compareBytesBetweenDV(resultWI.cursor.rowLength, row, existingRow, rowHeaderSize, rowHeaderSize) === -1) {
                    writeRow = false;
                    break;
                }
                distinctCursor = readNext(resultWI.table, resultWI.def, distinctCursor);
            }
        }
        if (writeRow) {
            let newRow = addRow(resultWI.table.data, lenNewBuffer, context);
            copyBytesBetweenDV(resultWI.cursor.rowLength, row, newRow, rowHeaderSize, rowHeaderSize);
            rowsModified++;
            if (statement.top !== undefined) {
                if (statement.orderBy === undefined || statement.orderBy.length === 0) {
                    let topValue = evaluate(db, context, statement.top, [], undefined);
                    if ((typeof topValue === "number" && topValue <= rowsModified) || (isNumeric(topValue) && topValue.m <= rowsModified)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    for (let i = 0; i < execPlan.steps.length; i++) {
        let p = execPlan.steps[i];
        if (p.kind === "TEPScan") {
            let ps = p as TEPScan;
            let tblName = getValueForAliasTableOrLiteral(ps.table);
            let tblInfo = db.tableInfo.get(tblName.table);

            let info: TTableWalkInfo = {
                name: tblInfo.def.name.toUpperCase(),
                table: tblInfo.pointer,
                def: tblInfo.def,
                cursor: readFirst(tblInfo.pointer, tblInfo.def),
                rowLength: recordSize(tblInfo.pointer.data),
                alias: tblName.alias
            }
            runScan(db, context, ps, context.tables,  runCallback);
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
            //console.log("PRE SORT");
            //console.log(dumpTable(resultWI.table));
            bubbleSort(db, context, resultWI.table,resultWI.def, ps.orderBy);
            //console.log("POST SORT");
            //console.log(dumpTable(resultWI.table));
            if (ps.dest !== "") {

                let sortDestTable = db.getTable(ps.dest);
                if (sortDestTable === undefined) {
                    throw new TParserError("Could not find temp table " + ps.dest);
                }
                let sortDestTableDef = readTableDefinition(sortDestTable.data, false);

                let offsetRow = 0;
                let fetchXRow = undefined;
                if (ps.top !== undefined) {
                    let n = evaluate(db, context, ps.top,  [], undefined);
                    if (typeof n === "number") {
                        fetchXRow = n;
                    } else if (isNumeric(n)) {
                        fetchXRow = n.m;
                    }
                }
                if (ps.fetchExpression !== undefined) {
                    let n = evaluate(db, context, ps.fetchExpression,  [], undefined);
                    if (typeof n === "number") {
                        fetchXRow = n;
                    } else if (isNumeric(n)) {
                        fetchXRow = n.m;
                    }
                }
                if (ps.offsetExpression !== undefined) {
                    let n = evaluate(db, context, ps.offsetExpression,  [], undefined);
                    if (typeof n === "number") {
                        offsetRow = n;
                    } else if (isNumeric(n)) {
                        offsetRow = n.m;
                    }
                }
                let curs = readFirst(resultWI.table, resultWI.def);
                let offset = -1;
                let num = 0;
                while (!cursorEOF(curs)) {
                    let dv = new DataView(resultWI.table.data.blocks[curs.blockIndex], curs.offset, curs.rowLength + rowHeaderSize);
                    let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
                    const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
                    if (isDeleted) {
                        curs = readNext(resultWI.table, resultWI.def, curs);
                        continue;
                    }
                    offset++;
                    let grab = (offsetRow <= offset);
                    if ((grab && fetchXRow === undefined) || (grab && num < fetchXRow)) {
                        copyRow(dv, resultWI.table, resultWI.def, sortDestTable, sortDestTableDef, resultWI.table.data.blocks[curs.blockIndex].byteLength, context);
                        num++;
                    }
                    if (fetchXRow !== undefined && num >= fetchXRow) {
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

    if (statement.subSet !== undefined) {
        // open the result table from the previous st
        let mainTable = db.getTable(context.result.resultTableName);
        let mainTableDef = readTableDefinition(mainTable.data);
        let mainTableCursor = readFirst(mainTable, mainTableDef);
        let lenNewBuffer = 65536;
        while (mainTableCursor.rowLength > lenNewBuffer) {
            lenNewBuffer = lenNewBuffer * 2;
        }
        let subQuery = statement.subSet as TQuerySelect;
        let newC = createNewContext("subSet", "", undefined );
        addTempTablesToContext(newC, context.openedTempTables);
        let rt : TTable = processSelectStatement(db, newC, subQuery, true, {printDebug: false});
        addTempTablesToContext(context, newC.openedTempTables);
        addModifiedBlocksToContext(context, newC);
        let subSetTable = db.getTable(rt.table);
        let subSetTableDef = readTableDefinition(subSetTable.data);
        let subSetCursor = readFirst(subSetTable, subSetTableDef);

        if (statement.unionType !== kUnionType.none && statement.unionType !== kUnionType.intersect) {
            while (!cursorEOF(subSetCursor)) {
                let dv = new DataView(subSetTable.data.blocks[subSetCursor.blockIndex], subSetCursor.offset, subSetCursor.rowLength + rowHeaderSize);
                let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
                const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
                if (isDeleted) {
                    subSetCursor = readNext(subSetTable, subSetTableDef, subSetCursor);
                    continue;
                }
                let bCopyRow = true;
                let rowExists: { exists: boolean, info: {blockIndex: number, offset: number }[]};
                if (statement.unionType === kUnionType.union || statement.unionType === kUnionType.except) {
                    rowExists = isRowInSet(dv, subSetTable, subSetTableDef, mainTable, mainTableDef);
                    if (rowExists.exists === true && statement.unionType === kUnionType.union) {
                        //add row
                        bCopyRow = false;
                    } else if (statement.unionType === kUnionType.except) {
                        bCopyRow = false;
                        if (rowExists.exists === true) {
                            for (let i = 0; i < rowExists.info.length; i++) {
                                let row = new DataView(mainTable.data.blocks[rowExists.info[i].blockIndex], rowExists.info[i].offset);
                                let flag = row.getUint8(kBlockHeaderField.DataRowFlag);
                                flag = flag | kBlockHeaderField.DataRowFlag_BitDeleted;
                                row.setUint8(kBlockHeaderField.DataRowFlag, flag);
                            }
                        }
                    }
                } else if (statement.unionType === kUnionType.unionAll) {
                    bCopyRow = true;
                    rowsModified++;
                }
                if (bCopyRow === true) {
                    copyRow(dv, subSetTable, subSetTableDef, mainTable, mainTableDef, lenNewBuffer, context);
                    rowsModified++;
                }
                subSetCursor = readNext(subSetTable, subSetTableDef, subSetCursor);
            }
        } else if (statement.unionType === kUnionType.intersect) {
            while (!cursorEOF(mainTableCursor)) {
                let mainTableRow = new DataView(mainTable.data.blocks[mainTableCursor.blockIndex], mainTableCursor.offset, mainTableCursor.rowLength + rowHeaderSize);
                let flag = mainTableRow.getUint8(kBlockHeaderField.DataRowFlag);
                const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
                if (isDeleted) {
                    mainTableCursor = readNext(mainTable, mainTableDef, mainTableCursor);
                    continue;
                }

                let rowExists = isRowInSet(mainTableRow, mainTable, mainTableDef, subSetTable, subSetTableDef);
                if (rowExists.exists === false) {
                    let flag = mainTableRow.getUint8(kBlockHeaderField.DataRowFlag);
                    flag = flag | kBlockHeaderField.DataRowFlag_BitDeleted;
                    mainTableRow.setUint8(kBlockHeaderField.DataRowFlag, flag);
                }

                mainTableCursor = readNext(mainTable, mainTableDef, mainTableCursor);
            }
        }

    }

}