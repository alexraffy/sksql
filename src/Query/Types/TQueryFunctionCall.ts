import {TQueryExpression} from "./TQueryExpression";
import {TLiteral} from "./TLiteral";
import {TNumber} from "./TNumber";
import {TString} from "./TString";
import {TColumn} from "./TColumn";
import {TValidExpressions} from "./TValidExpressions";


export interface TQueryFunctionCall {
    kind: "TQueryFunctionCall",
    value: {
        name: string;
        parameters: (TQueryExpression | TValidExpressions)[];
    },
    aggregateDataId: string;
    distinct: boolean;
}