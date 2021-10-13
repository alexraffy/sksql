import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TNumber} from "./TNumber";
import {TQueryTable} from "./TQueryTable";
import {TQueryComparison} from "./TQueryComparison";
import {TQueryComparisonExpression} from "./TQueryComparisonExpression";


export interface TQueryDelete {
    kind: "TQueryDelete",
    tables: TQueryTable[];
    top?: TQueryExpression | TQueryFunctionCall | TVariable | TNumber;
    where: TQueryComparison | TQueryComparisonExpression
}