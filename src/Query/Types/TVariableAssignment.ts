import {TQueryExpression} from "./TQueryExpression";
import {TVariable} from "./TVariable";
import {TColumn} from "./TColumn";
import {TString} from "./TString";
import {TNumber} from "./TNumber";
import {TLiteral} from "./TLiteral";


export interface TVariableAssignment {
    kind: "TVariableAssignment",
    name: TVariable;
    value: TQueryExpression | TColumn | TString | TNumber | TLiteral;
}