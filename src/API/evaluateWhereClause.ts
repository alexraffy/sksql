import {TQueryComparisonDEPREC} from "../Query/Types/TQueryComparison";
import {TQueryComparisonExpressionDEPREC} from "../Query/Types/TQueryComparisonExpression";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {evaluate, TEvaluateOptions} from "./evaluate";
import {TArray} from "../Query/Types/TArray";
import {instanceOfTArray} from "../Query/Guards/instanceOfTArray";
import {compareValues} from "./compareValues";
import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {SKSQL} from "./SKSQL";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {readFirstColumnOfTable} from "./readFirstColumnOfTable";
import {readAllFirstColumns} from "./readAllFirstColumns";
import {instanceOfTBetween} from "../Query/Guards/instanceOfTBetween";
import {TBetween} from "../Query/Types/TBetween";
import {isNumeric} from "../Numeric/isNumeric";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {numeric} from "../Numeric/numeric";
import {numericAdjustExponent} from "../Numeric/numericAdjustExponent";
import {numericLoad} from "../Numeric/numericLoad";
import {numericFromNumber} from "../Numeric/numericFromNumber";
import {TDate} from "../Query/Types/TDate";
import {parseDateString} from "../Date/parseDateString";
import {TParserError} from "./TParserError";
import {TDateCmp} from "../Date/TDateCmp";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";
import {parseDateTimeString} from "../Date/parseDateTimeString";
import {TDateTimeCmp} from "../Date/TDateTimeCmp";
import {parseTimeString} from "../Date/parseTimeString";
import {TTimeCmp} from "../Date/TTimeCmp";
import {kBooleanResult} from "./kBooleanResult";

/*
export function evaluateWhereClauseDEPREC(
    db: SKSQL,
    context: TExecutionContext,
    struct: TQueryComparisonDEPREC | TQueryComparisonExpressionDEPREC | TQueryComparisonColumnEqualsString ,
    tables: TTableWalkInfo[],
    evaluateOptions: TEvaluateOptions = { aggregateMode: "none", aggregateObjects: []},
    withRow: {
        fullRow: DataView,
        table: ITable,
        def: ITableDefinition,
        offset: number
    } = undefined
): kBooleanResult {
    if (struct === undefined) {
        return kBooleanResult.isTrue;
    }
    if (instanceOfTQueryComparisonExpression(struct)) {
        let leftValue = evaluateWhereClauseDEPREC(db, context, struct.a, tables, evaluateOptions, withRow);
        let rightValue = evaluateWhereClauseDEPREC(db, context, struct.b, tables, evaluateOptions, withRow);

        switch (struct.bool) {
            case "AND": {
                if (leftValue === kBooleanResult.isTrue && rightValue === kBooleanResult.isTrue) {
                    return kBooleanResult.isTrue;
                }
                if (leftValue === kBooleanResult.isUnknown || rightValue === kBooleanResult.isUnknown) {
                    return kBooleanResult.isUnknown;
                }
                return kBooleanResult.isFalse;
            }
            break;
            case "AND NOT": {
                if (leftValue === kBooleanResult.isTrue && rightValue === kBooleanResult.isFalse) {
                    return kBooleanResult.isTrue;
                }
                if (leftValue === kBooleanResult.isUnknown || rightValue === kBooleanResult.isUnknown) {
                    return kBooleanResult.isUnknown;
                }
                return kBooleanResult.isFalse;
            }
            break;
            case "OR": {
                if (leftValue === kBooleanResult.isTrue || rightValue === kBooleanResult.isTrue) {
                    return kBooleanResult.isTrue;
                }
                if (leftValue === kBooleanResult.isUnknown || rightValue === kBooleanResult.isUnknown) {
                    return kBooleanResult.isUnknown;
                }
                return kBooleanResult.isFalse;
            }
        }
    }
    if (instanceOfTQueryComparisonColumnEqualsString(struct)) {
        let qc = struct as TQueryComparisonColumnEqualsString;
        let stringValue = evaluate(db, context, qc.value, tables, undefined, evaluateOptions, withRow);
        if (typeof stringValue === "string") {
            let copyOptions: TEvaluateOptions = {
                aggregateMode: evaluateOptions.aggregateMode,
                aggregateObjects: evaluateOptions.aggregateObjects,
                forceTable: evaluateOptions.forceTable,
                compareColumnToStringValue: stringValue as string,
                currentStep: evaluateOptions.currentStep
            };
            let columnValue: string = evaluate(db, context, qc.column, tables, undefined, copyOptions, withRow) as string;
            if (columnValue === undefined) {
                return kBooleanResult.isUnknown;
            }
            if (typeof columnValue === "string") {
                if (columnValue.localeCompare(stringValue) === 0) {
                    return kBooleanResult.isTrue;
                }
            }
        }
        return kBooleanResult.isFalse;
    }


    if (instanceOfTQueryComparison(struct)) {
        let qc = struct as TQueryComparisonDEPREC;
        let leftValue = evaluate(db, context, qc.left, tables, undefined, evaluateOptions, withRow);
        if (instanceOfTTable(leftValue)) {
            leftValue = readFirstColumnOfTable(db, context, leftValue);
        }
        if (leftValue === undefined && qc.comp.value !== kQueryComparison.isNull) {
            return kBooleanResult.isUnknown;
        }
        let rightValue = undefined;
        if (qc.comp.value === kQueryComparison.between) {
            if (!instanceOfTBetween(qc.right)) {
                throw "Between comparison not a valid range";
            }
            let b: TBetween = qc.right;
            let boundsLeft = evaluate(db, context, b.a, tables, undefined, evaluateOptions, withRow);
            let boundsRight = evaluate(db, context, b.b, tables, undefined, evaluateOptions, withRow);
            if (boundsLeft === undefined || boundsRight === undefined) {
                return kBooleanResult.isUnknown;
            }
            if (typeof leftValue === "number" && typeof boundsLeft === "number" && typeof boundsRight === "number") {
                let ret = (leftValue >= boundsLeft && leftValue <= boundsRight);
                if (ret === true && qc.comp.negative === false) {
                    return kBooleanResult.isTrue;
                } else if (ret === false && qc.comp.negative === true) {
                    return kBooleanResult.isTrue;
                }
                return kBooleanResult.isFalse;
            } else if(typeof leftValue === "string" && typeof boundsLeft === "string" && typeof boundsRight === "string") {
                let lc = leftValue.localeCompare(boundsLeft);
                let rc = leftValue.localeCompare(boundsRight);
                let ret = (lc >= 0 && rc <= 0);
                if (ret === true && qc.comp.negative === false) {
                    return kBooleanResult.isTrue;
                } else if (ret === false && qc.comp.negative === true) {
                    return kBooleanResult.isTrue;
                }
                return kBooleanResult.isFalse;
            } else if (isNumeric(boundsLeft) && isNumeric(boundsRight)) {
                let l : numeric;
                if (isNumeric(leftValue)) {
                    l = leftValue;
                } else if (typeof leftValue === "number") {
                    l = numericFromNumber(leftValue);
                } else if (typeof leftValue === "string") {
                    l = numericLoad(leftValue);
                }
                let bc = numericAdjustExponent(boundsLeft, boundsRight);
                let ac = numericAdjustExponent(l, bc.a);
                let ad = numericAdjustExponent(l, bc.b);
                let ret = ad.a.m >= ac.b.m && ad.a.m <= ad.b.m;
                if (ret === true && qc.comp.negative === false) {
                    return kBooleanResult.isTrue;
                } else if (ret === false && qc.comp.negative === true) {
                    return kBooleanResult.isTrue;
                }
                return kBooleanResult.isFalse;
            } else if (instanceOfTDate(boundsLeft) && instanceOfTDate(boundsRight)) {
                let l: TDate;
                if (instanceOfTDate(leftValue)) {
                    l = leftValue;
                } else if (instanceOfTDateTime(leftValue)) {
                    l = leftValue.date;
                } else if (leftValue === "string") {
                    l = parseDateString(leftValue);
                } else {
                    throw new TParserError("Value " + JSON.stringify(leftValue) + " not cast-able to date");
                }
                let ret = TDateCmp(l, boundsLeft) >= 0 && TDateCmp(l, boundsRight) <= 0;
                if (ret === true && qc.comp.negative === false) {
                    return kBooleanResult.isTrue;
                } else if (ret === false && qc.comp.negative === true) {
                    return kBooleanResult.isTrue;
                }
                return kBooleanResult.isFalse;
            } else if (instanceOfTDateTime(boundsLeft) && instanceOfTDateTime(boundsRight)) {
                let l: TDateTime;
                if (instanceOfTDateTime(leftValue)) {
                    l = leftValue;
                } else if (instanceOfTDate(leftValue)) {
                    l = {
                        kind: "TDateTime",
                        date: leftValue,
                        time: {kind: "TTime", hours: 0, minutes: 0, seconds: 0, millis: 0} as TTime
                    } as TDateTime;
                } else if (leftValue === "string") {
                    l = parseDateTimeString(leftValue);
                } else {
                    throw new TParserError("Value " + JSON.stringify(leftValue) + " not cast-able to datetime");
                }
                let ret = TDateTimeCmp(l, boundsLeft) >= 0 && TDateTimeCmp(l, boundsRight) <= 0;
                if (ret === true && qc.comp.negative === false) {
                    return kBooleanResult.isTrue;
                } else if (ret === false && qc.comp.negative === true) {
                    return kBooleanResult.isTrue;
                }
                return kBooleanResult.isFalse;
            } else if (instanceOfTTime(boundsLeft) && instanceOfTTime(boundsRight)) {
                let l: TTime;
                if (instanceOfTTime(leftValue)) {
                    l = leftValue;
                } else if (instanceOfTDateTime(leftValue)) {
                    l = leftValue.time;
                } else if (leftValue === "string") {
                    l = parseTimeString(leftValue);
                } else {
                    throw new TParserError("Value " + JSON.stringify(leftValue) + " not cast-able to time");
                }
                let ret = TTimeCmp(l, boundsLeft) >= 0 && TTimeCmp(l, boundsRight) <= 0;
                if (ret === true && qc.comp.negative === false) {
                    return kBooleanResult.isTrue;
                } else if (ret === false && qc.comp.negative === true) {
                    return kBooleanResult.isTrue;
                }
                return kBooleanResult.isFalse;
            }

        }
        if (qc.comp.value === kQueryComparison.in && (instanceOfTArray(qc.right) || instanceOfTTable(qc.right)) ) {
            let rightArray: TArray;

            if (instanceOfTTable(qc.right)) {
                rightArray = {
                    kind: "TArray",
                    array: []
                };
                let values = readAllFirstColumns(db, context, qc.right);
                for (let i = 0; i < values.length; i++) {
                    if (compareValues(leftValue, values[i]) === 0) {
                        return kBooleanResult.isTrue;
                    }
                }
                return kBooleanResult.isFalse;
            }
            if (instanceOfTArray(qc.right)) {
                rightArray = qc.right as TArray;
            }
            for (let x = 0; x < rightArray.array.length; x++) {
                let rv = evaluate(db, context, rightArray.array[x] as any, tables, undefined, evaluateOptions, withRow);
                if (instanceOfTTable(rv)) {
                    rv = readFirstColumnOfTable(db, context, rv);
                }
                if (compareValues(leftValue, rv) === 0) {
                    if (qc.comp.negative === true) { return kBooleanResult.isFalse;}
                    return kBooleanResult.isTrue;
                }
            }
            if (qc.comp.negative === true) { return kBooleanResult.isTrue;}
            return kBooleanResult.isFalse;
        }
        if (!instanceOfTArray(qc.right)) {
            rightValue = evaluate(db, context, qc.right, tables, undefined, evaluateOptions, withRow);
            if (instanceOfTTable(rightValue)) {
                rightValue = readFirstColumnOfTable(db, context, rightValue);
            }
            if (rightValue === undefined) {
                return kBooleanResult.isUnknown;
            }
        }

        let cmp = compareValues(leftValue, rightValue);

        switch (qc.comp.value) {
            case kQueryComparison.equal: {
                let ret = (qc.comp.negative === true) ? cmp !== 0 : cmp === 0;
                return ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse;
            }
            break;
            case kQueryComparison.superior: {
                let ret = (qc.comp.negative === true) ? cmp !== 1 : cmp === 1;
                return ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse;
            }
            case kQueryComparison.superiorEqual: {
                let ret =  (qc.comp.negative === true) ? cmp === -1 : cmp >= 0;
                return ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse;
            }
            break;
            case kQueryComparison.inferior: {
                let ret =  (qc.comp.negative === true) ? cmp !== -1 : cmp === -1;
                return ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse;
            }
            break;
            case kQueryComparison.inferiorEqual: {
                let ret = (qc.comp.negative === true) ? cmp === 1 : cmp <= 0;
                return ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse;
            }
            break;
            case kQueryComparison.different: {
                let ret = (qc.comp.negative === true) ? cmp === 0 : cmp !== 0;
                return ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse;
            }
            break;
            case kQueryComparison.like: {
                let template = (rightValue as string).toUpperCase();
                if (template.startsWith("%")) {
                    template = "^(.*)" + template.substr(1);
                } else {
                    template = "^" + template;
                }
                while (template.indexOf("%") > -1) {
                    template = template.replace("%", "(.*)");
                }
                let test = new RegExp(template).test((leftValue as string).toUpperCase());
                let ret = (qc.comp.negative === true) ? !test : test;
                return ret === true ? kBooleanResult.isTrue : kBooleanResult.isFalse;
            }
            break;

        }


    }


}


 */




