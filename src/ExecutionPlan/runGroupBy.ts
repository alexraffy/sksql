import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TEPGroupBy} from "./TEPGroupBy";
import {bubbleSort} from "../Sort/bubbleSort";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {readValue} from "../BlockIO/readValue";
import {TableColumnType} from "../Table/TableColumnType";
import {numericCmp} from "../Numeric/numericCmp";
import {numeric} from "../Numeric/numeric";
import {TDateCmp} from "../Date/TDateCmp";
import {TDate} from "../Query/Types/TDate";
import {addRow, rowHeaderSize} from "../Table/addRow";
import {writeValue} from "../BlockIO/writeValue";
import {evaluate} from "../API/evaluate";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {SKSQL} from "../API/SKSQL";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {readPrevious} from "../Cursor/readPrevious";
import {readLast} from "../Cursor/readLast";
import {instanceOfTQueryCreateFunction} from "../Query/Guards/instanceOfTQueryCreateFunction";
import {TExecutionContext} from "./TExecutionContext";
import {cloneContext} from "./cloneContext";
import {swapContext} from "./swapContext";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {readFirstColumnOfTable} from "../API/readFirstColumnOfTable";
import {kBooleanResult} from "../API/kBooleanResult";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";
import {TBooleanResult} from "../API/TBooleanResult";


function writeRow(db: SKSQL, context: TExecutionContext, tw: TTableWalkInfo, td: TTableWalkInfo, tep: TEPGroupBy,
                  aggregateFunctions:{name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any}[] ) {
    let writeRecord: TBooleanResult = {kind: "TBooleanResult", value: kBooleanResult.isTrue};

    if (tep.having !== undefined) {
        writeRecord = evaluate(db, context, tep.having, context.tables, undefined, {forceTable: tw.name, aggregateMode: "final", aggregateObjects: aggregateFunctions}) as TBooleanResult;
    }
    if (instanceOfTBooleanResult(writeRecord) && writeRecord.value === kBooleanResult.isTrue) {
        let newRow = addRow(td.table.data, 4096);

        for (let x = 0; x < tep.projections.length; x++) {
            let p = tep.projections[x];
            let col = td.def.columns.find((t) => {
                return t.name.toUpperCase() === p.columnName.toUpperCase();
            });
            if (col !== undefined) {
                let value = evaluate(db, context, p.output, context.tables, col, {
                    forceTable: tw.name,
                    aggregateMode: "final",
                    aggregateObjects: aggregateFunctions,
                    currentStep: tep
                });
                if (instanceOfTTable(value)) {
                    value = readFirstColumnOfTable(db, context, value);
                }
                if (instanceOfTBooleanResult(value)) {
                    value = value.value === kBooleanResult.isTrue;
                }
                writeValue(td.table, td.def, col, newRow, value, rowHeaderSize);
            }
        }
    }

}


export function runGroupBy(db: SKSQL, context: TExecutionContext, tep: TEPGroupBy, onRowSelected: (tep: TEPGroupBy, walkInfos: TTableWalkInfo[]) => boolean) {
    let tableToOpen = getValueForAliasTableOrLiteral(tep.source);
    let tw = context.tables.find((t) => { return t.name.toUpperCase() === tableToOpen.table.toUpperCase();});
    if (tw === undefined) {
        throw "GroupBy with unknown table";
    }
    bubbleSort(db, context, tw.table, tw.def, tep.groupBy);

    let destTable = getValueForAliasTableOrLiteral(tep.dest);
    let td = context.tables.find((t) => { return t.name.toUpperCase() === destTable.table.toUpperCase();});
    if (td === undefined) {
        throw "GroupBy with unknown table";
    }

    let groups = [];
    let group = undefined;
    let aggregateFunctions: {name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any}[] = tep.aggregateFunctions;


    // open a cursor on the sorted table
    tw.cursor = readFirst(tw.table, tw.def);
    while (!cursorEOF(tw.cursor)) {
        let row = new DataView(tw.table.data.blocks[tw.cursor.blockIndex], tw.cursor.offset, tw.cursor.rowLength);

        let groupValues = [];
        let isDifferent = false;
        for (let i = 0; i < tep.groupBy.length; i++) {
            let colName = tep.groupBy[i].column.alias.alias as string;

            let colDef = tw.def.columns.find((t) => { return t.name.toUpperCase() === colName.toUpperCase(); })
            let val = readValue(tw.table, tw.def, colDef, row, rowHeaderSize);
            groupValues.push(val);

            if (group !== undefined) {
                let gval = group[i];
                switch (colDef.type) {
                    case TableColumnType.varchar: {
                        if ((val as string).localeCompare(gval as string) !== 0) {
                            isDifferent = true;
                        }
                    }
                    break;
                    case TableColumnType.numeric: {
                        if (numericCmp(val as numeric, gval as numeric) !== 0) {
                            isDifferent = true;
                        }
                    }
                    break;
                    case TableColumnType.date: {
                        if (TDateCmp(val as TDate, gval as TDate) !== 0) {
                            isDifferent = true;
                        }
                    }
                    break;
                    case TableColumnType.time: {
                        // TODO
                        isDifferent = false;
                    }
                    break;
                    case TableColumnType.boolean: {
                        if (val as boolean !== gval as boolean) {
                            isDifferent = true;
                        }
                    }
                    break;
                    case TableColumnType.float: {
                        if (val !== gval) {
                            isDifferent = true;
                        }
                    }
                    break;
                    case TableColumnType.blob: {
                        // todo
                        isDifferent = false;
                    }
                    break;
                    default: {
                        if (val as number !== gval as number) {
                            isDifferent = true;
                        }
                    }
                    break;
                }

            }

        }



        if (group === undefined) {
            group = groupValues;
        } else {
            if (isDifferent) {
                tw.cursor = readPrevious(tw.table, tw.def, tw.cursor);
                if (!cursorEOF(tw.cursor)) {
                    writeRow(db, context, tw, td, tep, aggregateFunctions);
                }
                tw.cursor = readNext(tw.table, tw.def, tw.cursor);
                // reset data for aggregate functions
                for (let i = 0; i < aggregateFunctions.length; i++) {
                    if (!instanceOfTQueryCreateFunction(aggregateFunctions[i].fn.fn)) {
                        //@ts-ignore
                        aggregateFunctions[i].data = aggregateFunctions[i].fn.fn(context, "init", aggregateFunctions[i].funcCall.distinct, undefined);
                    }
                }

            }
            group = groupValues;
        }

        // call all aggregate functions for the row
        for (let x = 0; x < aggregateFunctions.length; x++) {
            let af = aggregateFunctions[x];
            let params: any[] = [];
            for (let i = 0; i < af.funcCall.value.parameters.length; i++) {
                let newContext: TExecutionContext = cloneContext(context, "GroupBy", true, false);
                newContext.tables = [tw];

                let val = evaluate(db, newContext, af.funcCall.value.parameters[i], newContext.tables, undefined,
                    {
                        aggregateMode: "row",
                        aggregateObjects: aggregateFunctions,
                        forceTable: tw.name
                    });
                swapContext(context, newContext);
                params.push(val);
            }
            if (!instanceOfTQueryCreateFunction(af.fn.fn)) {
                af.data = af.fn.fn(context, "row", af.funcCall.distinct, af.data, ...params);
            }

        }

        tw.cursor = readNext(tw.table, tw.def, tw.cursor);
    }
    tw.cursor = readLast(tw.table, tw.def, tw.cursor);
    if (!cursorEOF(tw.cursor)) {
        writeRow(db, context, tw, td, tep, aggregateFunctions);
    } else {
        if (group === undefined) {
            // reset data for aggregate functions
            for (let i = 0; i < aggregateFunctions.length; i++) {
                if (!instanceOfTQueryCreateFunction(aggregateFunctions[i].fn.fn)) {
                    //@ts-ignore
                    aggregateFunctions[i].data = aggregateFunctions[i].fn.fn(context, "init", aggregateFunctions[i].funcCall.distinct, undefined);
                }
            }
            writeRow(db, context, tw, td, tep, aggregateFunctions);
        }
    }






}