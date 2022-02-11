import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {TColumn} from "../Query/Types/TColumn";
import {instanceOfTVariable} from "../Query/Guards/instanceOfTVariable";
import {instanceOfTString} from "../Query/Guards/instanceOfTString";
import {instanceOfTNumber} from "../Query/Guards/instanceOfTNumber";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";
import {kQueryExpressionOp} from "../Query/Enums/kQueryExpressionOp";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {instanceOfTQueryColumn} from "../Query/Guards/instanceOfTQueryColumn";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {findTableNameForColumn} from "./findTableNameForColumn";
import {readValue} from "../BlockIO/readValue";
import {instanceOfTNull} from "../Query/Guards/instanceOfTNull";
import {numeric} from "../Numeric/numeric";
import {numericLoad} from "../Numeric/numericLoad";
import {TableColumn} from "../Table/TableColumn";
import {TableColumnType} from "../Table/TableColumnType";
import {numericAdd} from "../Numeric/numericAdd";
import {isNumeric} from "../Numeric/isNumeric";
import {numericSub} from "../Numeric/numericSub";
import {instanceOfTNumeric} from "../Query/Guards/instanceOfTNumeric";
import {numericFromNumber} from "../Numeric/numericFromNumber";
import {TDate} from "../Query/Types/TDate";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {SKSQL} from "./SKSQL";
import {findExpressionType} from "./findExpressionType";
import {columnTypeToString} from "../Table/columnTypeToString";
import {typeCanConvertTo} from "../Table/typeCanConvertTo";
import {convertToType} from "../Table/convertToType";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {kFunctionType} from "../Functions/kFunctionType";
import {TParserError} from "./TParserError";
import {TError} from "./TError";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {instanceOfTQueryCreateFunction} from "../Query/Guards/instanceOfTQueryCreateFunction";
import {runFunction} from "../ExecutionPlan/runFunction";
import {instanceOfTBoolValue} from "../Query/Guards/instanceOfTBoolValue";
import {TValidExpressions} from "../Query/Types/TValidExpressions";
import {instanceOfTCast} from "../Query/Guards/instanceOfTCast";
import {typeString2TableColumnType} from "./typeString2TableColumnType";
import {convertValue} from "./convertValue";
import {conversionMap} from "./conversionMap";
import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {instanceOfTVariableAssignment} from "../Query/Guards/instanceOfTVariableAssignment";
import {cloneContext} from "../ExecutionPlan/cloneContext";
import {swapContext} from "../ExecutionPlan/swapContext";

export interface TEvaluateOptions {
    aggregateMode: "none" | "init" | "row" | "final",
    aggregateObjects: { name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any }[],
    forceTable?: string
}


export function evaluate(
    db: SKSQL,
    context: TExecutionContext,
    struct: string | number | bigint | boolean | TQueryExpression | TValidExpressions | TQueryColumn,
    colDef: TableColumn,
    options: TEvaluateOptions = { aggregateMode: "none", aggregateObjects: []},
    withRow: {
        fullRow: DataView,
        table: ITable,
        def: ITableDefinition,
        offset: number
    } = undefined
): string | number | boolean | bigint | numeric | TDate | TTime | TDateTime
{
    if (struct === undefined) {
        return undefined;
    }

    if (instanceOfTBoolValue(struct)) {
        return struct.value;
    }

    if (instanceOfTNull(struct)) {
        return undefined;
    }
    if (instanceOfTDate(struct)) {
        return struct;
    }
    if (instanceOfTTime(struct)) {
        return struct;
    }
    if (instanceOfTDateTime(struct)) {
        return struct;
    }
    if (instanceOfTCast(struct)) {
        let t = typeString2TableColumnType(struct.cast.type);
        let exp = evaluate(db, context, struct.exp, colDef, options, withRow);
        return convertValue(exp, t);
    }


    if (instanceOfTVariable(struct)) {
        // look up the parameter
        let exists = context.stack.find((p) => { return p.name === struct.name;});
        if (!exists) {
            throw new TParserError("Parameter " + struct.name + " expected");
        }
        if (colDef !== undefined) {
            if (colDef.type === TableColumnType.numeric) {
                if (typeof exists.value === "string") {
                    return numericLoad(exists.value);
                } if (typeof exists.value === "number") {
                    return numericFromNumber(exists.value);
                }
            }
        }
        return exists.value;
    }

    if (instanceOfTString(struct)) {
        if (colDef !== undefined) {
            if (colDef.type === TableColumnType.numeric) {
                return numericLoad(struct.value.substr(1, struct.value.length - 2));
            }
        }
        return struct.value.substr(1, struct.value.length - 2);
    }
    if (instanceOfTNumber(struct)) {
        if (struct.value[0] === "'" || (struct.value[0] === '"')) {
            if (struct.value.indexOf(".") > -1) {
                return numericLoad(struct.value.substr(1, struct.value.length - 2));
            } else {
                return parseInt(struct.value.substr(1, struct.value.length - 2));
            }
        }
        if (struct.value.indexOf(".") > -1) {
            return numericLoad(struct.value);
        } else {
            return parseInt(struct.value);
        }
    }
    if (instanceOfTLiteral(struct) || instanceOfTColumn(struct)) {
        let name = "";
        let table = "";
        if (instanceOfTLiteral(struct)) {
            name = struct.value;
        } else if (instanceOfTColumn(struct)) {
            name = (struct as TColumn).column;
            table = struct.table
        }
        // look up the column
        if (withRow === undefined) {
            if (table === "") {

                let tablesMatch = findTableNameForColumn(name, context.openTables, context.currentStatement, options.forceTable);
                if (tablesMatch.length !== 1) {
                    if (context.openTables.length === 0) {
                        throw new TParserError("Unknown column name " + name);
                    }
                    if (context.openTables.length > 1) {
                        throw new TParserError("Ambiguous column name " + name);
                    }
                }
                table = tablesMatch[0];
            }
            let tableInfo = context.openTables.find((t) => {
                return t.name.toUpperCase() === table.toUpperCase()
            });
            let columnDef = tableInfo.def.columns.find((c) => {
                return c.name.toUpperCase() === name.toUpperCase();
            });
            if (columnDef === undefined) {
                throw new TParserError("Unknown column " + name + ". Could not find column definition in table " + table);
            }
            let dv = new DataView(tableInfo.table.data.blocks[tableInfo.cursor.blockIndex], tableInfo.cursor.offset, tableInfo.rowLength);
            let val = readValue(tableInfo.table, tableInfo.def, columnDef, dv, 5);
            return val;
        } else {
            let columnDef = withRow.def.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
            if (columnDef === undefined) {
                throw new TParserError("Unknown column " + name + ". Could not find column definition in table " + table);
            }
            let val = readValue(withRow.table, withRow.def, columnDef, withRow.fullRow, withRow.offset);

            return val;
        }
    }
    if (instanceOfTQueryColumn(struct)) {
        return evaluate(db, context, struct.expression, colDef, options, withRow);
    }
    if (instanceOfTQueryExpression(struct)) {
        let left = evaluate(db, context, struct.value.left, undefined, options, withRow);
        let right = evaluate(db, context, struct.value.right, undefined, options, withRow);
        let op = struct.value.op;

        let convertToType = conversionMap(left, right);
        left = convertValue(left, convertToType);
        right = convertValue(right, convertToType);

        if (typeof left !== typeof right) {
            throw new TError("Incompatible types between " + left + " and " + right);
        }
        if (isNumeric(left) && isNumeric(right)) {
            switch (op) {
                case kQueryExpressionOp.add:
                    return numericAdd(left, right);
                case kQueryExpressionOp.minus:
                    return numericSub(left, right);
            }
        }
        if (instanceOfTNumeric(left) && instanceOfTNumeric(right)) {
            switch (op) {
                case kQueryExpressionOp.add:
                    return numericAdd(left.value, right.value);
                case kQueryExpressionOp.minus:
                    return numericSub(left.value, right.value);
            }
        }

        if (typeof left === "number" && typeof right === "number") {
            switch (op) {
                case kQueryExpressionOp.add:
                    return left + right;
                case kQueryExpressionOp.minus:
                    return left - right;
                case kQueryExpressionOp.mul:
                    return left * right;
                case kQueryExpressionOp.div:
                    return left / right;
                case kQueryExpressionOp.modulo:
                    return left % right;
            }
        }
        if (typeof left === "string" && typeof right === "string") {
            if (op !== kQueryExpressionOp.add) {
                throw new TParserError("Incorrect operation between two strings.");
            }
            return left + right;
        }
        if (typeof left === "boolean" && typeof right === "boolean") {
            return left && right;
        }
    }

    if (instanceOfTVariableAssignment(struct)) {
        let value = evaluate(db, context, struct.value, colDef, options, withRow);
        let param = context.stack.find((p) => { return p.name.toUpperCase() === struct.name.name.toUpperCase();});
        if (param !== undefined) {
            param.value = value;
        }
    }

    if (instanceOfTQueryFunctionCall(struct)) {
        let fnName = struct.value.name;
        let fnData = db.getFunctionNamed(fnName);
        if (fnData === undefined) {
            throw new TParserError("Function " + fnName + " does not exist. Use declareFunction on your SKSQL instance before using it.");
        }
        if (fnData.parameters.length !== struct.value.parameters.length) {
            throw new TParserError(`Function ${fnName} expects ${fnData.parameters.length} parameters. Instead got ${struct.value.parameters.length}`);
        }
        let fnParameters = [];
        let sqlFunctionParams = [];
        if (fnData.type === kFunctionType.scalar) {
            for (let i = 0; i < struct.value.parameters.length; i++) {
                let param = struct.value.parameters[i];
                let expType = findExpressionType(db, param, context.openTables, context.stack);
                let paramValue = evaluate(db, context, param, colDef, options, withRow);

                //if (expType !== fnData.parameters[i].type) {
//                    if (!typeCanConvertTo(paramValue, expType, fnData.parameters[i].type)) {
//                        throw new TParserError(`Function ${fnName} expected parameter at index ${i} to be of type ${columnTypeToString(fnData.parameters[i].type)}. Instead got ${columnTypeToString(expType)}`);
//                    }

                    // paramValue = convertToType(paramValue, expType, fnData.parameters[i].type);
//                }
                if (paramValue !== undefined) {
                    paramValue = convertValue(paramValue, fnData.parameters[i].type);
                }
                fnParameters.push(paramValue);
                if (i < fnData.parameters.length) {
                    sqlFunctionParams.push({name: fnData.parameters[i].name, type: fnData.parameters[i].type, value: paramValue});
                }
            }
            if (instanceOfTQueryCreateFunction(fnData.fn)) {
                let newContext: TExecutionContext = cloneContext(context, "Function call", false, false);
                newContext.label = fnData.name;
                newContext.stack = sqlFunctionParams;
                newContext.scopedIdentity = context.scopedIdentity;
                let result = runFunction(db, newContext, fnData.fn);
                swapContext(context, newContext);
                context.exitExecution = false;
                context.breakLoop = false;
                return result;
            } else {
                let result = fnData.fn(context, ...fnParameters);
                return result;
            }
        } else {
            if (options.aggregateMode === "final") {
                // find the aggregate data
                if (options.aggregateObjects === undefined || options.aggregateObjects.length === 0) {
                    throw new TParserError(`Function ${fnName} is an aggregate function but no data was computed for previous rows.`);
                }
                let ao = options.aggregateObjects.find((a) => {
                    return a.name.toUpperCase() === fnData.name.toUpperCase();
                });
                if (!instanceOfTQueryCreateFunction(fnData.fn)) {
                    let result = fnData.fn(context, ao.data, undefined);
                    return result;
                }
            }
        }
    }
}