import {TEPScan} from "./TEPScan";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Query/Types/TQueryComparison";


export interface TEPNestedLoop {
    kind: "TEPNestedLoop",
    a: TEPScan,
    b: TEPScan | TEPNestedLoop,
    join: TQueryComparisonExpression | TQueryComparison
}