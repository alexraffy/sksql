import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TBoolValue} from "./TBoolValue";
import {TQuerySelect} from "./TQuerySelect";
import {TColumn} from "./TColumn";
import {TString} from "./TString";
import {TLiteral} from "./TLiteral";
import {TNumber} from "./TNumber";
import {TTable} from "./TTable";
import {TNull} from "./TNull";


export interface TQueryInsert {
    kind: "TQueryInsert",
    table: TTable,
    columns: TLiteral[];
    hasValues: boolean;
    values: (TQueryExpression | TQueryFunctionCall | TVariable | TBoolValue | TNull | TColumn | TString | TLiteral | TNumber)[];
    selectStatement: TQuerySelect;
}