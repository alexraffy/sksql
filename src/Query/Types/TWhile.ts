
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";
import {TQueryExpression} from "./TQueryExpression";
import {TValidExpressions} from "./TValidExpressions";


export interface TWhile {
    kind: "TWhile",
    test: TQueryExpression | TValidExpressions;
    op: TValidStatementsInFunction[];
}