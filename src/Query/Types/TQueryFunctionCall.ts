import {TQueryExpression} from "./TQueryExpression";
import {TLiteral} from "./TLiteral";
import {TNumber} from "./TNumber";
import {TString} from "./TString";
import {TColumn} from "./TColumn";


export interface TQueryFunctionCall {
    kind: "TQueryFunctionCall",
    value: {
        name: string;
        parameters: (TQueryFunctionCall | TQueryExpression | TColumn | TLiteral | TNumber | TString)[];
    }
}