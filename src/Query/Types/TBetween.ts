import {TNumber} from "./TNumber";
import {TQueryExpression} from "./TQueryExpression";


export interface TBetween {
    kind: "TBetween";
    a: TQueryExpression | TNumber;
    b: TQueryExpression | TNumber;
}