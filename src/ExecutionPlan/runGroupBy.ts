import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TEPGroupBy} from "./TEPGroupBy";
import {bubbleSort} from "../Sort/bubbleSort";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TColumn} from "../Query/Types/TColumn";
import {TLiteral} from "../Query/Types/TLiteral";
import {readValue} from "../BlockIO/readValue";
import {TableColumnType} from "../Table/TableColumnType";
import {numericCmp} from "../Numeric/numericCmp";
import {numeric} from "../Numeric/numeric";
import {TDateCmp} from "../Date/TDateCmp";
import {TDate} from "../Query/Types/TDate";
import {addRow} from "../Table/addRow";
import {writeValue} from "../BlockIO/writeValue";
import {evaluate} from "../API/evaluate";
import {findExpressionType, TFindExpressionTypeOptions} from "../API/findExpressionType";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {DBData} from "../API/DBInit";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {evaluateWhereClause} from "../API/evaluateWhereClause";
import {readPrevious} from "../Cursor/readPrevious";
import {readLast} from "../Cursor/readLast";



function writeRow(tw: TTableWalkInfo, td: TTableWalkInfo, tep: TEPGroupBy, parameters: {name: string, value: any}[], aggregateFunctions:{name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any}[] ) {
    let writeRecord = true;

    if (tep.having !== undefined) {
        writeRecord = evaluateWhereClause(tep.having, parameters, [tw], {forceTable: tw.name, aggregateMode: "final", aggregateObjects: aggregateFunctions});
    }
    if (writeRecord) {
        let newRow = addRow(td.table.data, 4096);

        for (let x = 0; x < tep.projections.length; x++) {
            let p = tep.projections[x];
            let col = td.def.columns.find((t) => {
                return t.name.toUpperCase() === p.columnName.toUpperCase();
            });
            if (col !== undefined) {
                let value = evaluate(p.output, parameters, [tw], col, {
                    forceTable: tw.name,
                    aggregateMode: "final",
                    aggregateObjects: aggregateFunctions
                });
                writeValue(td.table, td.def, col, newRow, value, 0);
                console.log(p.columnName, value);
            }
        }
    }

}


export function runGroupBy(tep: TEPGroupBy, parameters: {name: string, value: any}[], tables: TTableWalkInfo[], onRowSelected: (tep: TEPGroupBy, walkInfos: TTableWalkInfo[]) => boolean) {
    let tableToOpen = getValueForAliasTableOrLiteral(tep.source);
    let tw = tables.find((t) => { return t.name.toUpperCase() === tableToOpen.table.toUpperCase();});
    if (tw === undefined) {
        throw "GroupBy with unknown table";
    }
    bubbleSort(tw.table, tw.def, tep.groupBy);

    let destTable = getValueForAliasTableOrLiteral(tep.dest);
    let td = tables.find((t) => { return t.name.toUpperCase() === destTable.table.toUpperCase();});
    if (td === undefined) {
        throw "GroupBy with unknown table";
    }

    let groups = [];
    let group = undefined;
    let aggregateFunctions: {name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any}[] = [];

    let cbFindAllAggregateFunctions = (o: any, key: string, value: any, options: TFindExpressionTypeOptions) => {
        if (key === "AGGREGATE") {
            let fnCall = o as TQueryFunctionCall;
            let fnData = DBData.instance.getFunctionNamed(fnCall.value.name.toUpperCase());
            if (fnData === undefined) {
                throw "Function " + fnCall.value.name.toUpperCase() + " does not exist. Use DBData.instance.declareFunction before using it.";
            }
            let fnAggData = fnData.fn(undefined);
            aggregateFunctions.push({
                name: fnCall.value.name.toUpperCase(),
                fn: fnData,
                funcCall: fnCall,
                data: fnAggData
            });
        }
        return true;
    }

    // find all aggregate functions
    for (let x = 0; x < tep.projections.length; x++) {
        let proj = tep.projections[x];
        findExpressionType(proj.output.expression, tables, cbFindAllAggregateFunctions, {callbackOnTColumn: true});
    }
    // having clause ?
    if (tep.having !== undefined) {
        findExpressionType(tep.having, tables, cbFindAllAggregateFunctions, {callbackOnTColumn: true});
    }


    // open a cursor on the sorted table
    tw.cursor = readFirst(tw.table, tw.def);
    while (!cursorEOF(tw.cursor)) {
        let row = new DataView(tw.table.data.blocks[tw.cursor.blockIndex], tw.cursor.offset, tw.cursor.rowLength);

        let groupValues = [];
        let isDifferent = false;
        for (let i = 0; i < tep.groupBy.length; i++) {
            let colName = "";
            if (instanceOfTColumn(tep.groupBy[i].column)) {
                colName = (tep.groupBy[i].column as TColumn).column.toUpperCase();
            } else if (instanceOfTLiteral(tep.groupBy[i].column)) {
                colName = (tep.groupBy[i].column as TLiteral).value.toUpperCase();
            } else {
                throw "Could not find column in order by clause";
            }
            if (colName === "ROWID") {
                return;
            }

            let colDef = tw.def.columns.find((t) => { return t.name.toUpperCase() === colName; })
            let val = readValue(tw.table, tw.def, colDef, row, 5);
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
                    writeRow(tw, td, tep, parameters, aggregateFunctions);
                }
                tw.cursor = readNext(tw.table, tw.def, tw.cursor);
                // reset data for aggregate functions
                for (let i = 0; i < aggregateFunctions.length; i++) {
                    aggregateFunctions[i].data = aggregateFunctions[i].fn.fn(undefined);
                }

            }
            group = groupValues;
        }

        // call all aggregate functions for the row
        for (let x = 0; x < aggregateFunctions.length; x++) {
            let af = aggregateFunctions[x];
            let params: any[] = [];
            for (let i = 0; i < af.funcCall.value.parameters.length; i++) {
                let val = evaluate(af.funcCall.value.parameters[i], parameters, [tw], undefined, {aggregateMode: "row", aggregateObjects: aggregateFunctions, forceTable: tw.name});
                params.push(val);
            }
            af.data = af.fn.fn(af.data, ...params);
            console.log(af.data);
        }

        tw.cursor = readNext(tw.table, tw.def, tw.cursor);
    }
    tw.cursor = readLast(tw.table, tw.def, tw.cursor);
    if (!cursorEOF(tw.cursor)) {
        writeRow(tw, td, tep, parameters, aggregateFunctions);
    }






}