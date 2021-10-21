import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {evaluate} from "./evaluate";
import {instanceOfTQueryComparison} from "../Query/Guards/instanceOfTQueryComparison";
import {kQueryComparison} from "../Query/Enums/kQueryComparison";
import {instanceOfTQueryComparisonExpression} from "../Query/Guards/instanceOfTQueryComparisonExpression";
import { TArray } from "../Query/Types/TArray";
import { instanceOfTArray } from "../Query/Guards/instanceOfTArray";
import { compareValues } from "./compareValues";


export function evaluateWhereClause(struct: TQueryComparison | TQueryComparisonExpression , parameters: {name: string, value: any}[], tables: TTableWalkInfo[]): boolean {
    if (struct === undefined) {
        return true;
    }

    if (instanceOfTQueryComparison(struct)) {
        let qc = struct as TQueryComparison;
        let leftValue = evaluate(qc.left, parameters, tables, undefined);
        let rightValue = undefined;
        if ( !instanceOfTArray(qc.right)) {
            rightValue = evaluate(qc.right, parameters, tables, undefined);
        }
        switch (qc.comp.value) {
            case kQueryComparison.equal:
                return (qc.comp.negative === true) ? leftValue !== rightValue : leftValue === rightValue;
            case kQueryComparison.superior:
                return (qc.comp.negative === true) ? leftValue <= rightValue : leftValue > rightValue;
            case kQueryComparison.superiorEqual:
                return (qc.comp.negative === true) ? leftValue < rightValue : leftValue >= rightValue;
            case kQueryComparison.inferior:
                return (qc.comp.negative === true) ? leftValue >= rightValue : leftValue < rightValue;
            case kQueryComparison.inferiorEqual:
                return (qc.comp.negative === true) ? leftValue > rightValue : leftValue <= rightValue;
            case kQueryComparison.different:
                return (qc.comp.negative === true) ? leftValue === rightValue : leftValue !== rightValue;
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
                let rightArray: TArray = qc.right as TArray;
                
                for (let x = 0; x < rightArray.array.length; x++) {
                    // @ts-ignore
                    let rv = evaluate(rightArray.array[x], parameters, tables, undefined);
                    if (compareValues(leftValue, rv) === 0) {
                        return true;
                    }

                }
                
                return false;
        }
    }
    if (instanceOfTQueryComparisonExpression(struct)) {
        let leftValue = evaluateWhereClause(struct.a, parameters, tables);
        let rightValue = evaluateWhereClause(struct.b, parameters, tables);
        switch (struct.bool) {
            case "AND":
                return leftValue && rightValue;
            case "AND NOT":
                return leftValue && !rightValue;
            case "OR":
                return leftValue || rightValue;
        }
    }
}
