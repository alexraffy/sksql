
import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {kQueryAssignOp} from "../Enums/kQueryAssignOp";
import {TColumn} from "./TColumn";
import {TVariable} from "./TVariable";
import {TNumber} from "./TNumber";
import {TQueryTable} from "./TQueryTable";
import {TTable} from "./TTable";
import {TValidExpressions} from "./TValidExpressions";


export interface TQueryUpdate {
    kind: "TQueryUpdate",
    table: TTable;
    top?: TQueryExpression | TQueryFunctionCall | TVariable | TNumber;
    tables: TQueryTable[];
    where: TQueryExpression | TValidExpressions;
    sets: {column: TColumn, operator: kQueryAssignOp, value: TQueryExpression | TValidExpressions}[];
}