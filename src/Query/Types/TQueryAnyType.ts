import {TQueryExpression} from "./TQueryExpression";
import {TQueryColumn} from "./TQueryColumn";
import {TBoolValue} from "./TBoolValue";
import {TString} from "./TString";
import {TNumber} from "./TNumber";
import {TQuerySelect} from "./TQuerySelect";
import {TColumn} from "./TColumn";
import {TQueryUpdate} from "./TQueryUpdate";
import {TQueryDelete} from "./TQueryDelete";
import {TLiteral} from "./TLiteral";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TNull} from "./TNull";
import {TDate} from "./TDate";


export type TQueryAnyType = TQueryExpression | TQueryFunctionCall | TQueryColumn | TDate | TString | TNull | TLiteral |
    TNumber | TVariable | TBoolValue | TQuerySelect | TQueryUpdate | TQueryDelete | TColumn;