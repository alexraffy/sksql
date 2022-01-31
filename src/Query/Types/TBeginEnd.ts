import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariableAssignment} from "./TVariableAssignment";
import {TVariableDeclaration} from "./TVariableDeclaration";
import {TReturnValue} from "./TReturnValue";
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";


export interface TBeginEnd {
    kind: "TBeginEnd",
    ops: TValidStatementsInFunction[];
}