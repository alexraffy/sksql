import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariableDeclaration} from "./TVariableDeclaration";
import {TVariableAssignment} from "./TVariableAssignment";
import {TReturnValue} from "./TReturnValue";
import {TBeginEnd} from "./TBeginEnd";
import {TWhile} from "./TWhile";
import {TIf} from "./TIf";
import {TBreak} from "./TBreak";
import {TDebugger} from "./TDebugger";



export type TValidStatementsInFunction = TQueryFunctionCall | TBeginEnd | TIf | TWhile |
    TVariableDeclaration | TVariableAssignment | TReturnValue | TBreak | TDebugger;