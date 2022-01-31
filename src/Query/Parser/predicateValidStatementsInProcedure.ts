import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTBeginEnd} from "./predicateTBeginEnd";
import {predicateTIf} from "./predicateTIf";
import {predicateTWhile} from "./predicateTWhile";
import {predicateTVariableDeclaration} from "./predicateTVariableDeclaration";
import {predicateTVariableAssignment} from "./predicateTVariableAssignment";
import {predicateReturnValue} from "./predicateReturnValue";
import {predicateTBreak} from "./predicateTBreak";
import {predicateTDebugger} from "./predicateTDebugger";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTQuerySelect} from "./predicateTQuerySelect";
import {predicateTQueryUpdate} from "./predicateTQueryUpdate";
import {predicateTQueryInsert} from "./predicateTQueryInsert";
import {predicateTQueryDelete} from "./predicateTQueryDelete";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {predicateTExecute} from "./predicateTExecute";
import {predicateTComment} from "./predicateTComment";
import {predicateTQueryDrop} from "./predicateTQueryDrop";


export function * predicateValidStatementsInProcedure(callback) {

    let ret = yield oneOf([
        predicateTComment,
        predicateTQuerySelect,
        predicateTQueryUpdate,
        predicateTQueryInsert,
        predicateTQueryDelete,
        predicateTQueryDrop,
        predicateTQueryFunctionCall,
        predicateTBeginEnd,
        predicateTIf,
        predicateTWhile,
        predicateTVariableDeclaration,
        predicateTVariableAssignment,
        predicateReturnValue,
        predicateTBreak,
        predicateTDebugger,
        predicateTExecute

    ], "A valid statement");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield returnPred(ret);

}