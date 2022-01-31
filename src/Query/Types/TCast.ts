import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TColumn} from "./TColumn";
import {TVariable} from "./TVariable";
import {TBoolValue} from "./TBoolValue";
import {TDateTime} from "./TDateTime";
import {TDate} from "./TDate";
import {TNumber} from "./TNumber";
import {TLiteral} from "./TLiteral";
import {TTime} from "./TTime";
import {TColumnType} from "./TColumnType";
import {TValidExpressions} from "./TValidExpressions";


export interface TCast {
    kind: "TCast",
    exp: TQueryExpression | TValidExpressions;
    cast: TColumnType;

}