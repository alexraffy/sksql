import {TNumber} from "./TNumber";
import {TQueryExpression} from "./TQueryExpression";
import {TValidExpressions} from "./TValidExpressions";


export interface TBetween {
    kind: "TBetween";
    a: TQueryExpression | TValidExpressions;
    b: TQueryExpression | TValidExpressions;
}