import {TString} from "./TString";
import {TQueryExpression} from "./TQueryExpression";
import {TValidExpressions} from "./TValidExpressions";


export interface TDebugger {
    kind: "TDebugger";
    label?: TString;
    test?: TQueryExpression | TValidExpressions; //TQueryComparisonExpression | TQueryComparison;

}