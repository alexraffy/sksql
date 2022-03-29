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
import {numericFromNumber} from "../Numeric/numericFromNumber";
import {TDate} from "../Query/Types/TDate";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {instanceOfTQueryFunctionCall} from "../Query/Guards/instanceOfTQueryFunctionCall";
import {SKSQL} from "./SKSQL";
import {findExpressionType} from "./findExpressionType";
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
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {processSelectStatement} from "../ExecutionPlan/processSelectStatement";
import {TTable} from "../Query/Types/TTable";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {readFirstColumnOfTable} from "./readFirstColumnOfTable";
import {createNewContext} from "../ExecutionPlan/newContext";
import {TEP} from "../ExecutionPlan/TEP";
import {TEPScan} from "../ExecutionPlan/TEPScan";
import {TEPNestedLoop} from "../ExecutionPlan/TEPNestedLoop";
import {TEPGroupBy} from "../ExecutionPlan/TEPGroupBy";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TEPSortNTop} from "../ExecutionPlan/TEPSortNTop";
import {kBooleanResult} from "./kBooleanResult";
import {instanceOfTBetween} from "../Query/Guards/instanceOfTBetween";
import {TBetween} from "../Query/Types/TBetween";
import {numericAdjustExponent} from "../Numeric/numericAdjustExponent";
import {parseDateString} from "../Date/parseDateString";
import {TDateCmp} from "../Date/TDateCmp";
import {parseDateTimeString} from "../Date/parseDateTimeString";
import {TDateTimeCmp} from "../Date/TDateTimeCmp";
import {parseTimeString} from "../Date/parseTimeString";
import {TTimeCmp} from "../Date/TTimeCmp";
import {TBooleanResult} from "./TBooleanResult";
import {instanceOfTArray} from "../Query/Guards/instanceOfTArray";
import {TArray} from "../Query/Types/TArray";
import {readAllFirstColumns} from "./readAllFirstColumns";
import {compareValues} from "./compareValues";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {instanceOfTCaseWhen} from "../Query/Guards/instanceOfTCaseWhen";
import {TCaseWhen} from "../Query/Types/TCaseWhen";
import {numericMul} from "../Numeric/numericMul";
import {numericDiv} from "../Numeric/numericDiv";
import {columnTypeIsInteger} from "../Table/columnTypeIsInteger";
import {numericRound} from "../Numeric/numericRound";

export interface TEvaluateOptions {
    aggregateMode: "none" | "init" | "row" | "final";
    aggregateObjects: { name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any }[];
    forceTable?: string;
    compareColumnToStringValue?: string;
    currentStep?: TEP;
}


export function evaluate(
    db: SKSQL,
    context: TExecutionContext,
    struct: string | number | bigint | boolean | TDate | TDateTime | TTime | TQueryExpression | TValidExpressions | TQueryColumn,
    tables: TTableWalkInfo[],
    colDef: TableColumn,
    options: TEvaluateOptions = { currentStep: undefined, compareColumnToStringValue: undefined, aggregateMode: "none", aggregateObjects: []},
    withRow: {
        fullRow: DataView,
        table: ITable,
        def: ITableDefinition,
        offset: number
    } = undefined,

): string | number | boolean | bigint | numeric | TDate | TTime | TDateTime | TTable | TBooleanResult
{
    if (struct === undefined) {
        return undefined;
    }
    if (typeof struct === "string") {
        return struct;
    }
    if (typeof struct === "boolean") {
        return struct;
    }
    if (typeof struct === "number") {
        return struct;
    }
    if (instanceOfTDate(struct)) {
        return struct;
    }
    if (instanceOfTDateTime(struct)) {
        return struct;
    }
    if (instanceOfTTime(struct)) {
        return struct;
    }
    if (isNumeric(struct)) {
        return struct;
    }
    if (typeof struct === "bigint") {
        return struct;
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
        let exp = evaluate(db, context, struct.exp, tables, colDef, options, withRow);
        if (instanceOfTTable(exp)) {
            let value  = readFirstColumnOfTable(db, context, exp);
            return convertValue(value, t);
        }
        let cv = convertValue(exp, t);
        if (t === TableColumnType.numeric && isNumeric(cv)) {
            // do we need to round ?
            let decimals = evaluate(db, context, struct.cast.dec, tables, colDef, options, withRow);
            cv = numericRound(cv, decimals as number);
        }
        return cv;
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

                let tablesMatch = findTableNameForColumn(name, tables, context.currentStatement, options.forceTable);
                if (tablesMatch.length !== 1) {
                    if (tablesMatch.length === 0) {
                        throw new TParserError("Unknown column name " + name);
                    }
                    if (tablesMatch.length > 1) {
                        throw new TParserError("Ambiguous column name " + name);
                    }
                }
                table = tablesMatch[0];
            }
            let tableInfo;
            tableInfo = tables.find((t) => {
                    return t.name.toUpperCase() === table.toUpperCase()
                });

            if (tableInfo === undefined) {
                // try aliases
                tableInfo = tables.find((t) => {
                        return t.alias.toUpperCase() === table.toUpperCase()
                    });

            }
            if (tableInfo === undefined) {
                throw new TParserError("Could not find table " + table);
            }
            let columnDef = tableInfo.def.columns.find((c) => {
                return c.name.toUpperCase() === name.toUpperCase();
            });
            if (columnDef === undefined) {
                throw new TParserError("Unknown column " + name + ". Could not find column definition in table " + table);
            }
            let dv = new DataView(tableInfo.table.data.blocks[tableInfo.cursor.blockIndex], tableInfo.cursor.offset, tableInfo.rowLength);

            let val = readValue(tableInfo.table, tableInfo.def, columnDef, dv, 5, options.compareColumnToStringValue);
            return val;
        } else {
            let columnDef = withRow.def.columns.find((c) => { return c.name.toUpperCase() === name.toUpperCase();});
            if (columnDef === undefined) {
                throw new TParserError("Unknown column " + name + ". Could not find column definition in table " + table);
            }
            let val = readValue(withRow.table, withRow.def, columnDef, withRow.fullRow, withRow.offset, options.compareColumnToStringValue);

            return val;
        }
    }
    if (instanceOfTQueryColumn(struct)) {
        return evaluate(db, context, struct.expression, tables, colDef, options, withRow);
    }
    if (instanceOfTQueryExpression(struct)) {
        let left = evaluate(db, context, struct.value.left, tables, undefined, options, withRow);
        let right;
        let op = struct.value.op;
        if (instanceOfTTable(left)) {
            left = readFirstColumnOfTable(db, context, left);
        }


        if ([kQueryExpressionOp.boolAnd, kQueryExpressionOp.boolAndNot, kQueryExpressionOp.boolOR].includes(op)) {
            right = evaluate(db, context, struct.value.right, tables, undefined, options, withRow);
            if (!instanceOfTBooleanResult(left) || !instanceOfTBooleanResult(right)) {
                throw new TParserError("boolean expression expected");
            }

            switch (op) {
                case kQueryExpressionOp.boolAnd: {
                    if (left.value === kBooleanResult.isTrue && right.value === kBooleanResult.isTrue) {
                        return {kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    }
                    if (left.value === kBooleanResult.isUnknown || right.value === kBooleanResult.isUnknown) {
                        return {kind: "TBooleanResult", value: kBooleanResult.isUnknown};
                    }
                    return {kind: "TBooleanResult", value: kBooleanResult.isFalse};
                }
                    break;
                case kQueryExpressionOp.boolAndNot: {
                    if (left.value === kBooleanResult.isTrue && right.value === kBooleanResult.isFalse) {
                        return {kind: "TBooleanResult", value: kBooleanResult.isTrue};
                    }
                    if (left.value === kBooleanResult.isUnknown || right.value === kBooleanResult.isUnknown) {
                        return {kind: "TBooleanResult", value: kBooleanResult.isUnknown};
                    }
                    return {kind: "TBooleanResult", value: kBooleanResult.isFalse};
                }
                    break;
                case kQueryExpressionOp.boolOR: {
                    if (left.value === kBooleanResult.isTrue || right.value === kBooleanResult.isTrue) {
                        return {kind: "TBooleanResult", value: kBooleanResult.isTrue};
                    }
                    if (left.value === kBooleanResult.isUnknown || right.value === kBooleanResult.isUnknown) {
                        return {kind: "TBooleanResult", value: kBooleanResult.isUnknown};
                    }
                    return {kind: "TBooleanResult", value: kBooleanResult.isFalse};
                }
            }
        }

        if ([kQueryExpressionOp.eq, kQueryExpressionOp.dif, kQueryExpressionOp.sup, kQueryExpressionOp.supEq,
            kQueryExpressionOp.inf, kQueryExpressionOp.infEq, kQueryExpressionOp.like, kQueryExpressionOp.between,
            kQueryExpressionOp.in, kQueryExpressionOp.notLike, kQueryExpressionOp.notBetween,kQueryExpressionOp.notIn,
            kQueryExpressionOp.isNull, kQueryExpressionOp.isNotNull].includes(op)) {
            if (left === undefined && op !== kQueryExpressionOp.isNull) {
                return {
                    kind: "TBooleanResult",
                    value: kBooleanResult.isUnknown
                } as TBooleanResult;
            }
            if (op === kQueryExpressionOp.isNull) {
                if (left === undefined) {
                    return {
                        kind: "TBooleanResult",
                        value: kBooleanResult.isTrue
                    } as TBooleanResult;
                } else {
                    return {
                        kind: "TBooleanResult",
                        value: kBooleanResult.isFalse
                    } as TBooleanResult;
                }
            }
            if (op === kQueryExpressionOp.isNotNull) {
                if (left === undefined) {
                    return {
                        kind: "TBooleanResult",
                        value: kBooleanResult.isFalse
                    } as TBooleanResult;
                } else {
                    return {
                        kind: "TBooleanResult",
                        value: kBooleanResult.isTrue
                    } as TBooleanResult;
                }
            }
            if (op === kQueryExpressionOp.between || op === kQueryExpressionOp.notBetween) {
                if (!instanceOfTBetween(struct.value.right)) {
                    throw new TParserError("Between comparison not a valid range");
                }
                let b: TBetween = struct.value.right;
                let boundsLeft = evaluate(db, context, b.a, tables, undefined, options, withRow);
                let boundsRight = evaluate(db, context, b.b, tables, undefined, options, withRow);
                if (boundsLeft === undefined || boundsRight === undefined) {
                    return {
                        kind: "TBooleanResult",
                        value: kBooleanResult.isUnknown
                    } as TBooleanResult;
                }
                if (typeof left === "number" && typeof boundsLeft === "number" && typeof boundsRight === "number") {
                    let ret = (left >= boundsLeft && left <= boundsRight);
                    if (ret === true && op === kQueryExpressionOp.between) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue};
                    } else if (ret === false && op === kQueryExpressionOp.notBetween) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue};
                    }
                    return { kind: "TBooleanResult", value: kBooleanResult.isFalse };
                } else if(typeof left === "string" && typeof boundsLeft === "string" && typeof boundsRight === "string") {
                    let lc = left.localeCompare(boundsLeft);
                    let rc = left.localeCompare(boundsRight);
                    let ret = (lc >= 0 && rc <= 0);
                    if (ret === true && op === kQueryExpressionOp.between) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue};
                    } else if (ret === false && op === kQueryExpressionOp.notBetween) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    }
                    return { kind: "TBooleanResult", value: kBooleanResult.isFalse };
                } else if (isNumeric(boundsLeft) && isNumeric(boundsRight)) {
                    let l : numeric;
                    if (isNumeric(left)) {
                        l = left;
                    } else if (typeof left === "number") {
                        l = numericFromNumber(left);
                    } else if (typeof left === "string") {
                        l = numericLoad(left);
                    }
                    let bc = numericAdjustExponent(boundsLeft, boundsRight);
                    let ac = numericAdjustExponent(l, bc.a);
                    let ad = numericAdjustExponent(l, bc.b);
                    let ret = ad.a.m >= ac.b.m && ad.a.m <= ad.b.m;
                    if (ret === true && op === kQueryExpressionOp.between) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    } else if (ret === false && op === kQueryExpressionOp.notBetween) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    }
                    return { kind: "TBooleanResult", value: kBooleanResult.isFalse };
                } else if (instanceOfTDate(boundsLeft) && instanceOfTDate(boundsRight)) {
                    let l: TDate;
                    if (instanceOfTDate(left)) {
                        l = left;
                    } else if (instanceOfTDateTime(left)) {
                        l = left.date;
                    } else if (left === "string") {
                        l = parseDateString(left);
                    } else {
                        throw new TParserError("Value " + JSON.stringify(left) + " not cast-able to date");
                    }
                    let ret = TDateCmp(l, boundsLeft) >= 0 && TDateCmp(l, boundsRight) <= 0;
                    if (ret === true && op === kQueryExpressionOp.between) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    } else if (ret === false && op === kQueryExpressionOp.notBetween) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    }
                    return { kind: "TBooleanResult", value: kBooleanResult.isFalse };
                } else if (instanceOfTDateTime(boundsLeft) && instanceOfTDateTime(boundsRight)) {
                    let l: TDateTime;
                    if (instanceOfTDateTime(left)) {
                        l = left;
                    } else if (instanceOfTDate(left)) {
                        l = {
                            kind: "TDateTime",
                            date: left,
                            time: {kind: "TTime", hours: 0, minutes: 0, seconds: 0, millis: 0} as TTime
                        } as TDateTime;
                    } else if (left === "string") {
                        l = parseDateTimeString(left);
                    } else {
                        throw new TParserError("Value " + JSON.stringify(left) + " not cast-able to datetime");
                    }
                    let ret = TDateTimeCmp(l, boundsLeft) >= 0 && TDateTimeCmp(l, boundsRight) <= 0;
                    if (ret === true && op === kQueryExpressionOp.between) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    } else if (ret === false && op === kQueryExpressionOp.notBetween) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    }
                    return { kind: "TBooleanResult", value: kBooleanResult.isFalse };
                } else if (instanceOfTTime(boundsLeft) && instanceOfTTime(boundsRight)) {
                    let l: TTime;
                    if (instanceOfTTime(left)) {
                        l = left;
                    } else if (instanceOfTDateTime(left)) {
                        l = left.time;
                    } else if (left === "string") {
                        l = parseTimeString(left);
                    } else {
                        throw new TParserError("Value " + JSON.stringify(left) + " not cast-able to time");
                    }
                    let ret = TTimeCmp(l, boundsLeft) >= 0 && TTimeCmp(l, boundsRight) <= 0;
                    if (ret === true && op === kQueryExpressionOp.between) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    } else if (ret === false && op === kQueryExpressionOp.notBetween) {
                        return { kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    }
                    return { kind: "TBooleanResult", value: kBooleanResult.isFalse };
                }

            }
            if (op === kQueryExpressionOp.in || op === kQueryExpressionOp.notIn) {
                let rightArray: TArray;
                if (!(instanceOfTArray(struct.value.right) || instanceOfTTable(struct.value.right) || instanceOfTQuerySelect(struct.value.right))) {
                    throw new TParserError("IN should be followed by an array or by a select statement")
                }
                let tt: TTable;
                if (instanceOfTQuerySelect(struct.value.right)) {
                    let newC = createNewContext("subQuery", context.query, undefined);
                    newC.stack = context.stack;
                    tt = evaluate(db, newC, struct.value.right, newC.tables, undefined, options, withRow) as TTable;
                } else if (instanceOfTTable(struct.value.right)) {
                    tt = struct.value.right;
                }

                if (instanceOfTTable(tt)) {
                    rightArray = {
                        kind: "TArray",
                        array: []
                    };
                    let values = readAllFirstColumns(db, context, tt);
                    for (let i = 0; i < values.length; i++) {
                        if (compareValues(left, values[i]) === 0) {
                            if (op === kQueryExpressionOp.in) {
                                return {kind: "TBooleanResult", value: kBooleanResult.isTrue};
                            } else {
                                return {kind: "TBooleanResult", value: kBooleanResult.isFalse};
                            }
                        }
                    }
                    return {kind: "TBooleanResult", value: kBooleanResult.isFalse};
                }

                if (instanceOfTArray(struct.value.right)) {
                    rightArray = struct.value.right as TArray;
                }
                for (let x = 0; x < rightArray.array.length; x++) {
                    let rv = evaluate(db, context, rightArray.array[x] as any, tables, undefined, options, withRow);
                    if (instanceOfTTable(rv)) {
                        rv = readFirstColumnOfTable(db, context, rv);
                    }
                    if (compareValues(left, rv) === 0) {
                        if (op === kQueryExpressionOp.notIn) {
                            return {kind: "TBooleanResult", value: kBooleanResult.isFalse };
                        }
                        return {kind: "TBooleanResult", value: kBooleanResult.isTrue };
                    }
                }
                if (op === kQueryExpressionOp.notIn) { return {kind: "TBooleanResult", value: kBooleanResult.isTrue}; }
                return {kind: "TBooleanResult", value: kBooleanResult.isFalse };
            }
            right = evaluate(db, context, struct.value.right, tables, undefined, options, withRow);
            if (instanceOfTTable(right)) {
                right = readFirstColumnOfTable(db, context, right);
            }
            if (right === undefined) {
                return {kind: "TBooleanResult", value: kBooleanResult.isUnknown };
            }
            let cmp = compareValues(left, right);
            switch (op) {
                case kQueryExpressionOp.eq:
                {
                    return {kind: "TBooleanResult", value: cmp === 0 ? kBooleanResult.isTrue : kBooleanResult.isFalse };
                }
                break;
                case kQueryExpressionOp.sup: {
                    return {kind: "TBooleanResult", value: cmp === 1 ? kBooleanResult.isTrue : kBooleanResult.isFalse };
                }
                break;
                case kQueryExpressionOp.supEq: {
                    return {kind: "TBooleanResult", value: cmp >= 0 ? kBooleanResult.isTrue : kBooleanResult.isFalse };
                }
                break;
                case kQueryExpressionOp.inf: {
                    return {kind: "TBooleanResult", value: cmp === -1 ? kBooleanResult.isTrue : kBooleanResult.isFalse };
                }
                break;
                case kQueryExpressionOp.infEq: {
                    return {kind: "TBooleanResult", value: cmp <= 0 ? kBooleanResult.isTrue : kBooleanResult.isFalse };
                }
                break;
                case kQueryExpressionOp.dif: {
                    return {kind: "TBooleanResult", value: cmp !== 0 ? kBooleanResult.isTrue : kBooleanResult.isFalse };
                }
                break;
                case kQueryExpressionOp.like:
                case kQueryExpressionOp.notLike:
                {
                    let template = (right as string).toUpperCase();
                    if (template.startsWith("%")) {
                        template = "^(.*)" + template.substr(1);
                    } else {
                        template = "^" + template;
                    }
                    while (template.indexOf("%") > -1) {
                        template = template.replace("%", "(.*)");
                    }
                    let test = new RegExp(template).test((left as string).toUpperCase());

                    let ret = (op === kQueryExpressionOp.notLike) ? !test : test;
                    return {kind: "TBooleanResult", value: ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse};
                }
                break;

            }
        }
        if ([kQueryExpressionOp.mul, kQueryExpressionOp.div, kQueryExpressionOp.modulo, kQueryExpressionOp.add, kQueryExpressionOp.minus].includes(op)) {

            right = evaluate(db, context, struct.value.right, tables, undefined, options, withRow);
            if (instanceOfTTable(right)) {
                right = readFirstColumnOfTable(db, context, right);
            }

            if (left === undefined || right === undefined) {
                return undefined;
            }

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
                    case kQueryExpressionOp.mul:
                        return numericMul(left, right);
                    case kQueryExpressionOp.div: {
                        if (right.m === 0) {
                            throw new TParserError("Divide by zero");
                        }
                        return numericDiv(left, right);
                    }
                    break;
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
                    case kQueryExpressionOp.div: {
                        if (right === 0) {
                            throw new TParserError("Divide by zero");
                        }
                        let ret = left / right;
                        if (columnTypeIsInteger(convertToType)) {
                            return parseInt(ret.toString());
                        }
                        return ret;
                    }
                    break;
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
    }

    if (instanceOfTCaseWhen(struct)) {
        let obj = struct as TCaseWhen;
        let caseValue = undefined;
        if (obj.case !== undefined) {
            caseValue = evaluate(db, context, obj.case, tables, undefined, options, withRow);
            if (instanceOfTTable(caseValue)) {
                caseValue = readFirstColumnOfTable(db, context, caseValue);
            }
        }
        for (let i = 0; i < obj.whens.length; i++) {
            let w = evaluate(db, context, obj.whens[i].test, tables, undefined, options, withRow);
            if (instanceOfTTable(w)) {
                w = readFirstColumnOfTable(db, context, w);
            }
            if (caseValue !== undefined) {
                let cmp = compareValues(caseValue, w);
                if (cmp === 0) {
                    let retValue = evaluate(db, context, obj.whens[i].ret, tables, undefined, options, withRow);
                    if (instanceOfTTable(retValue)) {
                        retValue = readFirstColumnOfTable(db, context, retValue);
                    }
                    return retValue;
                }
            } else {
                let ok = false;
                if (instanceOfTBooleanResult(w)) {
                    ok = w.value === kBooleanResult.isTrue;
                } else if (typeof w === "boolean") {
                    ok = w;
                }
                if (ok) {
                    let retValue = evaluate(db, context, obj.whens[i].ret, tables, undefined, options, withRow);
                    if (instanceOfTTable(retValue)) {
                        retValue = readFirstColumnOfTable(db, context, retValue);
                    }
                    return retValue;
                }
            }
        }
        let elseValue = evaluate(db, context, obj.else, tables, undefined, options, withRow);
        if (instanceOfTTable(elseValue)) {
            elseValue = readFirstColumnOfTable(db, context, elseValue);
        }
        return elseValue;
    }

    if (instanceOfTVariableAssignment(struct)) {
        //@ts-ignore
        let value = evaluate(db, context, struct.value, colDef, options, withRow);
        if (instanceOfTTable(value)) {
            value = readFirstColumnOfTable(db, context, value);
        }
        //@ts-ignore
        let param = context.stack.find((p) => { return p.name.toUpperCase() === struct.name.name.toUpperCase();});
        if (param !== undefined) {
            if (instanceOfTBooleanResult(value)) {
                param.value = (value.value === kBooleanResult.isTrue) ? true : false;
            } else {
                param.value = value;
            }
        }
    }

    if (instanceOfTQueryFunctionCall(struct)) {
        let fnName = struct.value.name;
        let fnData = db.getFunctionNamed(fnName);

        if (fnData === undefined) {
            throw new TParserError("Function " + fnName + " does not exist. Use declareFunction on your SKSQL instance before using it.");
        }
        if (fnData.parameters.length !== struct.value.parameters.length && fnData.hasVariableParams === false) {
            throw new TParserError(`Function ${fnName} expects ${fnData.parameters.length} parameters. Instead got ${struct.value.parameters.length}`);
        }
        let fnParameters = [];
        let sqlFunctionParams = [];
        if (fnData.type === kFunctionType.scalar) {
            for (let i = 0; i < struct.value.parameters.length; i++) {
                let param = struct.value.parameters[i];
                let expType = findExpressionType(db, param, struct, tables, context.stack);
                let paramValue = evaluate(db, context, param, tables, colDef, options, withRow);
                if (instanceOfTTable(paramValue)) {
                    paramValue = readFirstColumnOfTable(db, context, paramValue);
                }
                //if (expType !== fnData.parameters[i].type) {
//                    if (!typeCanConvertTo(paramValue, expType, fnData.parameters[i].type)) {
//                        throw new TParserError(`Function ${fnName} expected parameter at index ${i} to be of type ${columnTypeToString(fnData.parameters[i].type)}. Instead got ${columnTypeToString(expType)}`);
//                    }

                    // paramValue = convertToType(paramValue, expType, fnData.parameters[i].type);
//                }
                let idx = 0;
                if (paramValue !== undefined) {

                    if (i < fnData.parameters.length-1) {
                        idx = i;
                    } else {
                        idx = fnData.parameters.length -1;
                    }
                    paramValue = convertValue(paramValue, fnData.parameters[idx].type);
                }
                fnParameters.push(paramValue);
                if (i < fnData.parameters.length) {
                    sqlFunctionParams.push({name: fnData.parameters[idx].name, type: fnData.parameters[idx].type, value: paramValue});
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
                    return a.funcCall.aggregateDataId === struct.aggregateDataId;
                });
                if (!instanceOfTQueryCreateFunction(fnData.fn)) {
                    let result = fnData.fn(context, "final", ao.funcCall.distinct, ao.data, undefined);
                    return result;
                }
            }
        }
    }

    if (instanceOfTQuerySelect(struct)) {
        let subQueryContext = createNewContext("", "", undefined);
        subQueryContext.tables = [];
        subQueryContext.stack = context.stack;
        let destTable = "";
        if ((struct as TQuerySelect).hasForeignColumns) {
            if (options.currentStep !== undefined) {
                let s = options.currentStep;
                if (s.kind === "TEPScan") {
                    destTable = (s as TEPScan).result;
                }
                if (s.kind === "TEPNestedLoop") {
                    destTable = (s as TEPNestedLoop).a.result;
                }
                if (s.kind === "TEPGroupBy") {
                    destTable = getValueForAliasTableOrLiteral((s as TEPGroupBy).dest).table;
                }
                if (s.kind === "TEPSortNTop") {
                    destTable = getValueForAliasTableOrLiteral((s as TEPSortNTop).dest).table;
                }
            }
            for (let i = 0; i < context.tables.length; i++) {
                let t = context.tables[i];
                if (t.name.toUpperCase() !== destTable.toUpperCase()) {
                    subQueryContext.tables.push(t);
                }
            }
        }
        let newStruct = JSON.parse(JSON.stringify(struct));
        let tt = processSelectStatement(db, subQueryContext, newStruct);
        context.openedTempTables.push(...subQueryContext.openedTempTables);

        return tt;

    }

}