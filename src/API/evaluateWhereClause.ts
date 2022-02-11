import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {evaluate, TEvaluateOptions} from "./evaluate";
import {instanceOfTQueryComparison} from "../Query/Guards/instanceOfTQueryComparison";
import {kQueryComparison} from "../Query/Enums/kQueryComparison";
import {instanceOfTQueryComparisonExpression} from "../Query/Guards/instanceOfTQueryComparisonExpression";
import {TArray} from "../Query/Types/TArray";
import {instanceOfTArray} from "../Query/Guards/instanceOfTArray";
import {compareValues} from "./compareValues";
import {isNumeric} from "../Numeric/isNumeric";
import {numericCmp} from "../Numeric/numericCmp";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {TDateCmp} from "../Date/TDateCmp";
import {TDateTimeCmp} from "../Date/TDateTimeCmp";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {TTimeCmp} from "../Date/TTimeCmp";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {TParserError} from "./TParserError";
import {TableColumnType} from "../Table/TableColumnType";
import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {SKSQL} from "./SKSQL";


export function evaluateWhereClause(
    db: SKSQL,
    context: TExecutionContext,
    struct: TQueryComparison | TQueryComparisonExpression ,
    evaluateOptions: TEvaluateOptions = { aggregateMode: "none", aggregateObjects: []},
    withRow: {
        fullRow: DataView,
        table: ITable,
        def: ITableDefinition,
        offset: number
    } = undefined
): boolean {
    if (struct === undefined) {
        return true;
    }
    if (instanceOfTQueryComparisonExpression(struct)) {
        let leftValue = evaluateWhereClause(db, context, struct.a, evaluateOptions, withRow);
        let rightValue = evaluateWhereClause(db, context, struct.b, evaluateOptions, withRow);
        switch (struct.bool) {
            case "AND":
                return leftValue && rightValue;
            case "AND NOT":
                return leftValue && !rightValue;
            case "OR":
                return leftValue || rightValue;
        }
    }
    if (instanceOfTQueryComparison(struct)) {
        let qc = struct as TQueryComparison;
        let leftValue = evaluate(db, context, qc.left, undefined, evaluateOptions, withRow);
        let rightValue = undefined;
        if (qc.comp.value === kQueryComparison.in && instanceOfTArray(qc.right)) {
            let rightArray: TArray = qc.right as TArray;
            for (let x = 0; x < rightArray.array.length; x++) {
                let rv = evaluate(db, context, rightArray.array[x] as any, undefined, evaluateOptions, withRow);
                if (compareValues(leftValue, rv) === 0) {
                    if (qc.comp.negative === true) { return false;}
                    return true;
                }
            }
            if (qc.comp.negative === true) { return true;}
            return false;
        }
        if (!instanceOfTArray(qc.right)) {
            rightValue = evaluate(db, context, qc.right, undefined, evaluateOptions, withRow);
        }

        let cmp = compareValues(leftValue, rightValue);

        switch (qc.comp.value) {
            case kQueryComparison.equal:
                return (qc.comp.negative === true) ? cmp !== 0 : cmp === 0;
            case kQueryComparison.superior:
                return (qc.comp.negative === true) ? cmp !== 1 : cmp === 1;
            case kQueryComparison.superiorEqual:
                return (qc.comp.negative === true) ? cmp === -1 : cmp >= 0;
            case kQueryComparison.inferior:
                return (qc.comp.negative === true) ? cmp !== -1 : cmp === -1;
            case kQueryComparison.inferiorEqual:
                return (qc.comp.negative === true) ? cmp === 1 : cmp <= 0;
            case kQueryComparison.different:
                return (qc.comp.negative === true) ? cmp === 0 : cmp !== 0;
            case kQueryComparison.like:
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
                return (qc.comp.negative === true) ? !test : test;
            case kQueryComparison.between:
                //TODO
                return false;
            case kQueryComparison.in:
                return false;
        }


    }


}





