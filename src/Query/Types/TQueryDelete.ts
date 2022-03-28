import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TNumber} from "./TNumber";
import {TQueryTable} from "./TQueryTable";
import {TValidExpressions} from "./TValidExpressions";


export interface TQueryDelete {
    kind: "TQueryDelete",
    tables: TQueryTable[];
    top?: TQueryExpression | TValidExpressions;
    where: TQueryExpression | TValidExpressions;
}