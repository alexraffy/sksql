import {TableColumnType} from "../Table/TableColumnType";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTBoolValue} from "../Query/Guards/instanceOfTBoolValue";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {SKSQL} from "./SKSQL";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";
import {walkTree} from "../ExecutionPlan/walkTree";
import {TableColumn} from "../Table/TableColumn";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";


export interface TFindExpressionTypeOptions {
    callbackOnTColumn: boolean;
    table?: TTableWalkInfo;
}


export function findExpressionType(db: SKSQL,
                                   o: any,
                                   currentStatement: TValidStatementsInProcedure,
                                   tables: TTableWalkInfo[],
                                   parameters: {name: string, type: TableColumnType, value: any}[],
                                   callback?: (o: any, key: string, value: string | number | boolean | any, options: TFindExpressionTypeOptions ) => boolean,
                                   options: TFindExpressionTypeOptions = {callbackOnTColumn: false}): TableColumnType {
    let ret = TableColumnType.int;
    let types: TableColumnType[] = [];
    walkTree(db, undefined, currentStatement, tables, parameters, o, [], {status: "", extra: {}},
        (obj: any, parents: any[], info: {colData: {table: TTableWalkInfo, def: TableColumn}, functionData: {name: string, data: TRegisteredFunction}}) => {

        if (instanceOfTQueryExpression(obj)) {
            if (["==", "=", "!=", "<>", "<=", "<", ">", ">=", "LIKE", "NOT LIKE", "IN", "NOT IN", "BETWEEN", "NOT", "NOT BETWEEN", "AND", "AND NOT", "OR"].includes(obj.value.op)) {
                types.push(TableColumnType.boolean);
                return false;
            }
            types.push(findExpressionType(db, obj.value.left, currentStatement, tables, parameters, callback, options));
            return false;
        }


        if (instanceOfTVariable(o)) {
            let param = parameters.find((p) => { return p.name === o.name;});
            if (param.type !== undefined) {
                types.push(param.type);
            }
        }

        if (instanceOfTNumber(o)) {
            if (o.value.indexOf(".") > -1) {
                types.push(TableColumnType.numeric);
            }
            types.push(TableColumnType.int32);
        }
        if (instanceOfTDate(o)) {
            types.push(TableColumnType.date);
        }
        if (instanceOfTTime(o)) {
            types.push(TableColumnType.time);
        }
        if (instanceOfTDateTime(o)) {
            types.push(TableColumnType.datetime);
        }
        if (instanceOfTString(o)) {
            types.push(TableColumnType.varchar);
        }
        if (instanceOfTBoolValue(o)) {
            types.push(TableColumnType.boolean);
        }

        if (instanceOfTColumn(o)) {
            if (callback !== undefined) {
                if (options.callbackOnTColumn === true) {
                    callback(o, "AGG_COLUMN", { table: info.colData.table.table, column: info.colData.def.name, def: info.colData.def}, options);
                }
            }
            types.push(info.colData.def.type);
        }

        if (instanceOfTQueryFunctionCall(o)) {
            if (info.functionData.data.returnTypeSameTypeHasParameterX !== undefined) {
                let t = findExpressionType(db, info.functionData.data.parameters[info.functionData.data.returnTypeSameTypeHasParameterX], currentStatement, tables, parameters);
                types.push(t);
                return false;
            }
            types.push(info.functionData.data.returnType);
            return false;
        }


        return true;
    });

    if (types.length === 0) {
        return TableColumnType.int;
    }
    let intSize = 1;
    let isSigned = false;
    for (let i = 0; i < types.length; i++) {
        let t = types[i];
        switch (t) {
            case TableColumnType.date:
                return TableColumnType.date;
            case TableColumnType.time:
                return TableColumnType.time;
            case TableColumnType.datetime:
                return TableColumnType.datetime;
            case TableColumnType.numeric:
                return TableColumnType.numeric;
            case TableColumnType.boolean:
                return TableColumnType.boolean;
            case TableColumnType.varchar:
                return TableColumnType.varchar;
            case TableColumnType.float:
                return TableColumnType.float;
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


/*
export function findExpressionTypeOLD(db: SKSQL,
                                   o: any,
                                   currentStatement: TValidStatementsInProcedure,
                                   tables: TTableWalkInfo[],
                                   parameters: {name: string, type: TableColumnType, value: any}[],
                                   callback?: (o: any, key: string, value: string | number | boolean | any, options: TFindExpressionTypeOptions ) => boolean,
                                   options: TFindExpressionTypeOptions = {callbackOnTColumn: false}): TableColumnType {
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
        if (instanceOfTVariable(o)) {
            let param = parameters.find((p) => { return p.name === o.name;});

            if (param.type !== undefined) {
                return param.type;
            }
        }
        if (instanceOfTColumn(o)) {
            let name = o.column;
            let table = o.table;
            // fix no table
            if (table === undefined || table === "") {
                let tableNames = findTableNameForColumn(name, tables, o);
                if (tableNames.length > 1) {
                    throw new TParserError("Ambiguous column name " + name);
                }
                if (tableNames.length === 0) {
                    throw new TParserError("Unknown column name " + name);
                }
                table = tableNames[0];
            }
            let t = tables.find((t) => {
                if (t.name === table) {
                    return true;
                }
                if (typeof t.alias === "string") {
                    if (t.alias === table) {
                        return true;
                    }
                } else if (instanceOfTAlias(t.alias)) {
                    let val = getValueForAliasTableOrLiteral(t.alias);
                    if (val.table === table || val.alias === table) {
                        return true;
                    }
                }
                return false;
            });
            if (t === undefined) {
                throw new TParserError("Could not find table for column " + name + " from TColumn " + JSON.stringify(o));
            }
            let colDef = t.def.columns.find( (col) => { return col.name.toUpperCase() === name.toUpperCase();});

            if (callback !== undefined) {
                if (options.callbackOnTColumn === true) {
                    callback(o, "AGG_COLUMN", { table: table, column: name, def: colDef}, options);
                }
            }

            return colDef.type;
        }
        if (instanceOfTNumber(o)) {
            if (o.value.indexOf(".") > -1) {
                return TableColumnType.numeric;
            }
            return TableColumnType.int32;
        }
        if (instanceOfTDate(o)) {
            return TableColumnType.date;
        }
        if (instanceOfTTime(o)) {
            return TableColumnType.time;
        }
        if (instanceOfTDateTime(o)) {
            return TableColumnType.datetime;
        }
        if (instanceOfTString(o)) {
            return TableColumnType.varchar;
        }
        if (instanceOfTBoolValue(o)) {
            return TableColumnType.boolean;
        }
        if (instanceOfTQueryFunctionCall(o)) {
            let fnName = o.value.name;
            let fnData = db.getFunctionNamed(fnName);
            if (fnData === undefined) {
                throw new TParserError("Function " + fnName + " does not exist. Use DBData.instance.declareFunction before using it.");
            }
            if (fnData.type === kFunctionType.aggregate) {
                if (callback !== undefined) {
                    callback(o, "AGGREGATE", true, options);
                }
            }

            for (let i = 0; i < o.value.parameters.length; i++) {
                findExpressionTypeOLD(db, o.value.parameters[i], currentStatement, tables, parameters, callback, {callbackOnTColumn: true});
            }

            if (fnData.returnTypeSameTypeHasParameterX !== undefined) {
                return findExpressionTypeOLD(db, fnData.parameters[fnData.returnTypeSameTypeHasParameterX], currentStatement, tables, parameters, callback, {callbackOnTColumn: true});
            }

            return fnData.returnType;
        }
        if (instanceOfTQueryColumn(o)) {
            return findExpressionTypeOLD(db, o.expression, currentStatement, tables, parameters, callback, {callbackOnTColumn: true});
        }
        if (instanceOfTQuerySelect(o)) {
            if (o.columns.length > 0) {
                let c = createNewContext("", "", undefined);
                for (let i = 0; i < o.tables.length; i++) {
                    contextTables(db, c, o.tables[0].tableName, undefined, undefined);
                }

                return findExpressionTypeOLD(db, o.columns[0].expression,  o,  c.tables, parameters, callback, {callbackOnTColumn: false});
            }
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
            case TableColumnType.date:
                return TableColumnType.date;
            case TableColumnType.time:
                return TableColumnType.time;
            case TableColumnType.datetime:
                return TableColumnType.datetime;
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
*/
