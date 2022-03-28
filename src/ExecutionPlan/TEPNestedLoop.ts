import {TEPScan} from "./TEPScan";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TValidExpressions} from "../Query/Types/TValidExpressions";


export interface TEPNestedLoop {
    kind: "TEPNestedLoop",
    a: TEPScan,
    b: TEPScan | TEPNestedLoop,
    join: TQueryExpression | TValidExpressions;
}