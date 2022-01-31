import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTBeginEnd} from "./predicateTBeginEnd";
import {predicateTIf} from "./predicateTIf";
import {predicateTWhile} from "./predicateTWhile";
import {predicateTVariableDeclaration} from "./predicateTVariableDeclaration";
import {predicateTVariableAssignment} from "./predicateTVariableAssignment";
import {predicateReturnValue} from "./predicateReturnValue";
import {predicateTBreak} from "./predicateTBreak";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTDebugger} from "./predicateTDebugger";
import {predicateTComment} from "./predicateTComment";


export function * predicateValidStatementsInFunction(callback) {

    let ret = yield oneOf([
        predicateTComment,
        predicateTQueryFunctionCall,
        predicateTBeginEnd,
        predicateTIf,
        predicateTWhile,
        predicateTVariableDeclaration,
        predicateTVariableAssignment,
        predicateReturnValue,
        predicateTBreak,
        predicateTDebugger

    ], "A valid statement");
    yield returnPred(ret);

}