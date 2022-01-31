import {TQueryExpression} from "./TQueryExpression";
import {TColumn} from "./TColumn";
import {TString} from "./TString";
import {TNumber} from "./TNumber";
import {TLiteral} from "./TLiteral";
import {TDateTime} from "./TDateTime";
import {TDate} from "./TDate";
import {TTime} from "./TTime";
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";
import {TValidExpressions} from "./TValidExpressions";


export interface TReturnValue {
    kind: "TReturnValue";
    value: TQueryExpression | TValidExpressions;
}