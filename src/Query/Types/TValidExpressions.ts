import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TBoolValue} from "./TBoolValue";
import {TColumn} from "./TColumn";
import {TLiteral} from "./TLiteral";
import {TCast} from "./TCast";
import {TDate} from "./TDate";
import {TDateTime} from "./TDateTime";
import {TTime} from "./TTime";
import {TNull} from "./TNull";
import {TNumber} from "./TNumber";
import {TString} from "./TString";
import {TArray} from "./TArray";


export type TValidExpressions = TCast | TQueryFunctionCall | TVariable |
    TBoolValue | TDateTime | TDate | TTime | TNull | TColumn | TLiteral | TNumber | TString | TArray;

