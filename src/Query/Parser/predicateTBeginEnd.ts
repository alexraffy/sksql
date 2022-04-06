import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {TBeginEnd} from "../Types/TBeginEnd";
import {TParserCallback} from "../../BaseParser/parse";
import {Stream} from "../../BaseParser/Stream";
import {predicateValidStatementsInProcedure} from "./predicateValidStatementsInProcedure";

// parse a BEGIN...END op in T-SQL

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