
import {TVariable} from "./TVariable";
import {TValidExpressions} from "./TValidExpressions";
import {TQueryExpression} from "./TQueryExpression";


export interface TVariableDeclaration {
    kind: "TVariableDeclaration";
    declarations: {
        name: TVariable,
        type: string;
        value: TQueryExpression | TValidExpressions;
    }[]
}