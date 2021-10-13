import {TQueryExpression} from "./TQueryExpression";
import {TVariable} from "./TVariable";
import {TColumn} from "./TColumn";
import {TNumber} from "./TNumber";
import {TLiteral} from "./TLiteral";
import {TString} from "./TString";


export interface TVariableDeclaration {
    kind: "TVariableDeclaration";
    name: TVariable,
    type: string;
    value: TQueryExpression | TColumn | TNumber | TLiteral | TString;
}