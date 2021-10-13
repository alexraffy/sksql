import {TableColumnType} from "../Table/TableColumnType";
import {instanceOfTQueryComparison} from "../Query/Guards/instanceOfTQueryComparison";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {instanceOfTQueryComparisonExpression} from "../Query/Guards/instanceOfTQueryComparisonExpression";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTBoolValue} from "../Query/Guards/instanceOfTBoolValue";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {findTableNameForColumn} from "./findTableNameForColumn";


export function findExpressionType(o: any, tables: TTableWalkInfo[]): TableColumnType {
    let ret = TableColumnType.int;

    let types: TableColumnType[] = [];
    let recursion = function (o: any): TableColumnType {
        if (instanceOfTQueryComparison(o)) {
            types.push(recursion((o as TQueryComparison).left));
            types.push(recursion((o as TQueryComparison).right));
        }
        if (instanceOfTQueryComparisonExpression(o)) {
            types.push(recursion(o.a));
            types.push(recursion(o.b));
        }
        if (instanceOfTQueryExpression(o)) {
            types.push(recursion(o.value.left));
            types.push(recursion(o.value.right));
        }
        if (instanceOfTQueryFunctionCall(o)) {
            let fc = o as TQueryFunctionCall;
            for (let i = 0; i < fc.value.parameters.length; i++) {
                types.push(recursion(fc.value.parameters[i]));
            }
        }
        if (instanceOfTColumn(o)) {
            let name = o.column;
            let table = o.table;
            // fix no table
            if (table === undefined || table === "") {
                let tableNames = findTableNameForColumn(name, tables);
                if (tableNames.length > 1) {
                    throw "Ambiguous column name " + name;
                }
                if (tableNames.length === 0) {
                    throw "Unknown column name " + name;
                }
                table = tableNames[0];
            }

            let t = tables.find((t) => { return t.alias === table;});
            let colDef = t.def.columns.find( (col) => { return col.name === name;});
            return colDef.type;
        }
        if (instanceOfTNumber(o)) {
            return TableColumnType.int;
        }
        if (instanceOfTString(o)) {
            return TableColumnType.varchar;
        }
        if (instanceOfTBoolValue(o)) {
            return TableColumnType.boolean;
        }
    }
    types.push(recursion(o));
    if (types.length === 0) {
        return TableColumnType.int;
    }
    let intSize = 1;
    let isSigned = false;
    for (let i = 0; i < types.length; i++) {
        let t = types[i];
        switch (t) {
            case TableColumnType.numeric:
                return TableColumnType.numeric;
            case TableColumnType.boolean:
                return TableColumnType.boolean;
            case TableColumnType.varchar:
                return TableColumnType.varchar;
            case TableColumnType.int:
            case TableColumnType.int16:
            case TableColumnType.int32:
            case TableColumnType.int64:
                isSigned = true;
                break;
            default: {
                if (isSigned !== true) {
                    isSigned = false;
                }
            }
        }
        if ((t === TableColumnType.int64 || t === TableColumnType.uint64) && intSize < 8) {
            intSize = 8;
        }
        if ((t === TableColumnType.int || t === TableColumnType.int32 || TableColumnType.uint32) && intSize < 4) {
            intSize = 4;
        }
        if (t === TableColumnType.int16 && intSize < 2) {
            intSize = 2;
        }
    }

    if (isSigned) {
        switch (intSize) {
            case 1:
                return TableColumnType.int8;
            case 2:
                return TableColumnType.int16;
            case 4:
                return TableColumnType.int32;
            case 8:
                return TableColumnType.int64;
        }
    } else {
        switch (intSize) {
            case 1:
                return TableColumnType.uint8;
            case 2:
                return TableColumnType.uint16;
            case 4:
                return TableColumnType.uint32;
            case 8:
                return TableColumnType.uint64;
        }
    }


    return ret;
}