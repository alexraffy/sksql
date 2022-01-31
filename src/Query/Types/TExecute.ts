import {TVariable} from "./TVariable";
import {TQueryExpression} from "./TQueryExpression";
import {TValidExpressions} from "./TValidExpressions";


export interface TExecute {
    kind: "TExecute";
    procName: string;
    returns?: TVariable;
    parameters: {
        name?: TVariable;
        order?: number;
        value: TQueryExpression | TValidExpressions;
        output: boolean;
    }[]

}