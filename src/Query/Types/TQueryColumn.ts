import {TAlias} from "./TAlias";
import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TLiteral} from "./TLiteral";
import {TString} from "./TString";
import {TNumber} from "./TNumber";
import {TColumn} from "./TColumn";
import {TNull} from "./TNull";
import {TBoolValue} from "./TBoolValue";


export interface TQueryColumn {
    kind: "TQueryColumn",
    alias: TAlias;
    expression: TQueryFunctionCall | TQueryExpression | TNull | TBoolValue | TColumn | TLiteral | TNumber | TString;

}