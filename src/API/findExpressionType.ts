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
import {typeString2TableColumnType} from "./typeString2TableColumnType";
import {instanceOfTCast} from "../Query/Guards/instanceOfTCast";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {openTables} from "./openTables";
import {generateEP} from "../ExecutionPlan/generateEP";
import {createNewContext} from "../ExecutionPlan/newContext";
import {TEPSelect} from "../ExecutionPlan/TEPSelect";
import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {getResultTableFromExecutionPlanSteps} from "../ExecutionPlan/getResultTableFromExecutionPlanSteps";
import {TTable} from "../Query/Types/TTable";
import {getFirstPublicColumn} from "../Table/getFirstPublicColumn";


export interface TFindExpressionTypeOptions {
    callbackOnTColumn: boolean;
    table?: TTableWalkInfo;
}

// Calculate the type of expression o

export function findExpressionType(db: SKSQL,
                                   context: TExecutionContext,
                                   o: any,
                                   currentStatement: TValidStatementsInProcedure,
                                   tables: TTableWalkInfo[],
                                   parameters: {name: string, type: TableColumnType, value: any}[],
                                   callback?: (o: any, key: string, value: string | number | boolean | any, options: TFindExpressionTypeOptions ) => boolean,
                                   options: TFindExpressionTypeOptions = {callbackOnTColumn: false}): TableColumnType {
    let ret = TableColumnType.int;
    let types: TableColumnType[] = [];

    let tablesToCheck = [];
    for (let i = 0; i < tables.length; i++) {
        tablesToCheck.push(tables[i]);
    }
    /*
    if (instanceOfTQuerySelect(o)) {
        let query = "";
        let context = createNewContext("", query, undefined);
        context.tables = tables;
        context.stack = parameters;

        //let steps = generateEP(db, context, o);
        //let lastStepDest = (steps[steps.length-1] as TEPSelect).dest;
        //let tbl = db.tableInfo.get(lastStepDest);
        //if (tbl === undefined || tbl.def.columns.length === 0) {
        //    return TableColumnType.int;
        //}
        //return tbl.def.columns[0].type;


        let ts: TTableWalkInfo[] = openTables(db, undefined, o);
        for (let i = 0; i < ts.length; i++) {
            let found = false;
            for (let x = 0; x < tablesToCheck.length; x++) {
                if (tablesToCheck[x].name.toUpperCase() === ts[i].name) {
                    found = true;
                }
            }
            if (found === false) {
                tablesToCheck.push(ts[i]);
            }
        }
    }
    */

    walkTree(db, undefined, currentStatement, tablesToCheck, parameters, o, [], {status: "", extra: {}},
        (obj: any, parents: any[], info: {colData: {table: TTableWalkInfo, def: TableColumn}, functionData: {name: string, data: TRegisteredFunction}}) => {


        if (instanceOfTQuerySelect(obj)) {

            let oldContext: TExecutionContext = undefined;

            /*
            // do we need this test?
            && (instanceOfTQueryColumn(parents[0]) ||
             instanceOfTQueryExpression(parents[0]) ||
             instanceOfTQueryFunctionCall(parents[0]) ||
             instanceOfTCast(parents[0]) ||
             instanceOfTCaseWhen(parents[0]))) {
             */

            // this is a subquery, we try to generate an execution plan.
            // if it fails that tell us that the subquery references a foreign table
            oldContext = context;
            let newC = createNewContext("subQuery", context.query, undefined);
            newC.stack = context.stack;
            newC.tables = [];
            for (let i = 0; i < oldContext.tables.length; i++) {
                if (oldContext.tables[i].name.startsWith("#")) {
                    newC.tables.push(oldContext.tables[i]);
                }
            }
            context = newC;
            let execPlans = generateEP(db, newC, obj, {previousContext: oldContext, printDebug: false});
            if (execPlans.length > 0) {
                // get the result table name
                let resultTable = getResultTableFromExecutionPlanSteps(execPlans[execPlans.length-1]);
                if (resultTable !== "") {
                    let t: TTable = {
                        kind: "TTable",
                        table: resultTable,
                        schema: "dbo"
                    }
                    let info = db.tableInfo.get(resultTable);
                    let firstColumn = getFirstPublicColumn(info.def);
                    types.push(firstColumn.type);
                    if (execPlans[execPlans.length-1].hasForeignTables === false) {
                        // we can replace the sub-query with the value
                        // OPTIMIZATION
                    }
                }


            }
            context = oldContext;
            context.openedTempTables.push(...newC.openedTempTables);
            return false;

        }



        if (instanceOfTQueryExpression(obj)) {
            if (["==", "=", "!=", "<>", "<=", "<", ">", ">=", "LIKE", "NOT LIKE", "IN", "NOT IN", "BETWEEN", "NOT", "NOT BETWEEN", "AND", "AND NOT", "OR"].includes(obj.value.op)) {
                types.push(TableColumnType.boolean);
                return false;
            }
            types.push(findExpressionType(db, context, obj.value.left, currentStatement, tables, parameters, callback, options));
            types.push(findExpressionType(db, context, obj.value.right, currentStatement, tables, parameters, callback, options));
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
        if (instanceOfTCast(o)) {
            types.push(typeString2TableColumnType(o.cast.type));
            return false;
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
                let t = findExpressionType(db, context, info.functionData.data.parameters[info.functionData.data.returnTypeSameTypeHasParameterX], currentStatement, tables, parameters);
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

