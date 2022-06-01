import {TQueryOrderBy} from "../Query/Types/TQueryOrderBy";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TVariable} from "../Query/Types/TVariable";
import {TNumber} from "../Query/Types/TNumber";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {TEP} from "./TEP";
import {TValidExpressions} from "../Query/Types/TValidExpressions";

// Sort stage
// if a TOP(X) is present it will be evaluated after the sort

export interface TEPSortNTop extends TEP {
    kind: "TEPSortNTop",
    source: string;
    orderBy: TQueryOrderBy[],
    dest: string;
    top?: TQueryExpression | TQueryFunctionCall | TNumber | TVariable;
    offsetExpression?: TQueryExpression | TValidExpressions;
    fetchExpression?: TQueryExpression | TValidExpressions;
}