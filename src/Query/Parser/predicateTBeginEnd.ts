import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TVariableAssignment} from "../Types/TVariableAssignment";
import {TVariableDeclaration} from "../Types/TVariableDeclaration";
import {TReturnValue} from "../Types/TReturnValue";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTVariableAssignment} from "./predicateTVariableAssignment";
import {predicateTVariableDeclaration} from "./predicateTVariableDeclaration";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateReturnValue} from "./predicateReturnValue";
import {TBeginEnd} from "../Types/TBeginEnd";
import {TParserCallback} from "../../BaseParser/parse";
import {Stream} from "../../BaseParser/Stream";
import {predicateTIf} from "./predicateTIf";
import {predicateTBreak} from "./predicateTBreak";
import {predicateTWhile} from "./predicateTWhile";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTDebugger} from "./predicateTDebugger";
import {predicateValidStatementsInProcedure} from "./predicateValidStatementsInProcedure";

export function * predicateTBeginEnd(callback: TParserCallback | Stream) {

    let ret: TBeginEnd = {
        kind: "TBeginEnd",
        ops: []
    }

    yield str("BEGIN");
    yield atLeast1(whitespaceOrNewLine);
    let exit = yield exitIf(str("END"));
    while (exit === false) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        ret.ops.push(yield predicateValidStatementsInProcedure);
        //ret.ops.push(yield oneOf([predicateTIf, predicateTWhile, predicateTQueryExpression, predicateTQueryFunctionCall, predicateTDebugger, predicateTBreak, predicateTVariableAssignment ,predicateTVariableDeclaration,  predicateReturnValue], ""));
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield maybe(str(";"))
        yield maybe(atLeast1(whitespaceOrNewLine));
        exit = yield exitIf(str("END"));
    }

    yield str("END");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield returnPred(ret);
}