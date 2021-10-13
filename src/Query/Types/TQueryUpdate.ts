import {TQueryComparison} from "./TQueryComparison";
import {TQueryComparisonExpression} from "./TQueryComparisonExpression";
import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TBoolValue} from "./TBoolValue";
import {kQueryExpressionOp} from "../Enums/kQueryExpressionOp";
import {kQueryAssignOp} from "../Enums/kQueryAssignOp";
import {TColumn} from "./TColumn";
import {TVariable} from "./TVariable";
import {TString} from "./TString";
import {TLiteral} from "./TLiteral";
import {TNumber} from "./TNumber";
import {TQueryTable} from "./TQueryTable";
import {TTable} from "./TTable";


export interface TQueryUpdate {
    kind: "TQueryUpdate",
    table: TTable;
    top?: TQueryExpression | TQueryFunctionCall | TVariable | TNumber;
    tables: TQueryTable[];
    where: TQueryComparison | TQueryComparisonExpression;
    sets: {column: TColumn, operator: kQueryAssignOp, value: TQueryExpression | TQueryFunctionCall | TVariable | TBoolValue | TColumn | TString | TLiteral | TNumber}[];
}