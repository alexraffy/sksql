import {TQueryComparisonExpression} from "./TQueryComparisonExpression";
import {TQueryComparison} from "./TQueryComparison";
import {TString} from "./TString";


export interface TDebugger {
    kind: "TDebugger";
    label?: TString;
    test?: TQueryComparisonExpression | TQueryComparison;

}