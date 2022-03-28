
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";
import {TQueryExpression} from "./TQueryExpression";
import {TValidExpressions} from "./TValidExpressions";


export interface TIf {
    kind: "TIf",
    tests: {
        test: TQueryExpression | TValidExpressions;
        op: TValidStatementsInFunction[];
    }[];
}