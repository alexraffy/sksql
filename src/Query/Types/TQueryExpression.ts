import {TNumber} from "./TNumber";
import {TLiteral} from "./TLiteral";
import {TString} from "./TString";
import {kQueryExpressionOp} from "../Enums/kQueryExpressionOp";
import {TColumn} from "./TColumn";


export interface TQueryExpression {
    kind: "TQueryExpression";
    value: {
        left: TQueryExpression | TColumn | TString | TLiteral | TNumber;
        op: kQueryExpressionOp;
        right: TQueryExpression | TColumn | TString | TLiteral | TNumber
    }
}