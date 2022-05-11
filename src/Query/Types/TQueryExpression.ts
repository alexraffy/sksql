import {TNumber} from "./TNumber";
import {TLiteral} from "./TLiteral";
import {TString} from "./TString";
import {kQueryExpressionOp} from "../Enums/kQueryExpressionOp";
import {TColumn} from "./TColumn";
import {TValidExpressions} from "./TValidExpressions";


export interface TQueryExpression {
    kind: "TQueryExpression";
    value: {
        left: TQueryExpression | TValidExpressions;
        op: kQueryExpressionOp;
        right: TQueryExpression | TValidExpressions;
    }
}