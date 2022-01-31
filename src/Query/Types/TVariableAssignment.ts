import {TQueryExpression} from "./TQueryExpression";
import {TVariable} from "./TVariable";
import {TColumn} from "./TColumn";
import {TString} from "./TString";
import {TNumber} from "./TNumber";
import {TLiteral} from "./TLiteral";
import {TDateTime} from "./TDateTime";
import {TTime} from "./TTime";
import {TDate} from "./TDate";
import {TValidExpressions} from "./TValidExpressions";


export interface TVariableAssignment {
    kind: "TVariableAssignment",
    name: TVariable;
    value: TQueryExpression | TValidExpressions;
}