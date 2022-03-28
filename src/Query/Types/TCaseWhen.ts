import {TQueryExpression} from "./TQueryExpression";


export interface TCaseWhen {
    kind: "TCaseWhen",
    case: TQueryExpression;
    whens: {test: TQueryExpression, ret: TQueryExpression}[];
    else: TQueryExpression;
}