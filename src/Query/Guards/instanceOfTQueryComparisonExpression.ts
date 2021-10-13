import {TQueryComparisonExpression} from "../Types/TQueryComparisonExpression";


export function instanceOfTQueryComparisonExpression(object: any): object is TQueryComparisonExpression {
    return object.kind === "TQueryComparisonExpression";
}