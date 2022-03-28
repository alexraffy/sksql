import {TQueryExpression} from "./TQueryExpression";
import {TValidExpressions} from "./TValidExpressions";


export interface TCount {
    kind: "TCount";
    distinct: boolean;
    expression: TQueryExpression | TValidExpressions;
}