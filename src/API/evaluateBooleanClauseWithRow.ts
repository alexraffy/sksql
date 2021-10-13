import {TQueryAnyType} from "../Query/Types/TQueryAnyType";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {ITableDefinition} from "../Table/ITableDefinition";
import {instanceOfTQueryComparison} from "../Query/Guards/instanceOfTQueryComparison";
import {evaluate} from "./evaluate";
import {kQueryComparison} from "../Query/Enums/kQueryComparison";
import {instanceOfTQueryComparisonExpression} from "../Query/Guards/instanceOfTQueryComparisonExpression";
import {ITable} from "../Table/ITable";
import {evaluateWithRow} from "./evaluateWithRow";


export function evaluateBooleanClauseWithRow(struct: TQueryComparisonExpression | TQueryComparison, table: ITable, def: ITableDefinition, fullRow: DataView, offset: number = 5) {
    if (struct === undefined) {
        return true;
    }

    if (instanceOfTQueryComparison(struct)) {
        let qc = struct as TQueryComparison;
        let leftValue = evaluateWithRow(qc.left, table, def, undefined, fullRow, offset);
        let rightValue = evaluateWithRow(qc.right, table, def, undefined, fullRow, offset);
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
                //TODO
                return false;
        }
    }
    if (instanceOfTQueryComparisonExpression(struct)) {
        let leftValue = evaluateBooleanClauseWithRow(struct.a, table, def, fullRow, offset);
        let rightValue = evaluateBooleanClauseWithRow(struct.b, table, def, fullRow, offset);
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