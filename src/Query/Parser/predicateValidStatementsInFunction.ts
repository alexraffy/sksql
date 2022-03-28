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
import {checkAhead} from "../../BaseParser/Predicates/checkAhead";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {str} from "../../BaseParser/Predicates/str";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {predicateTQueryCreateTable} from "./predicateTQueryCreateTable";
import {predicateTQueryCreateFunction} from "./predicateTQueryCreateFunction";
import {predicateTQueryCreateProcedure} from "./predicateTQueryCreateProcedure";
import {predicateTQueryDelete} from "./predicateTQueryDelete";
import {predicateTQueryDrop} from "./predicateTQueryDrop";
import {predicateTExecute} from "./predicateTExecute";
import {predicateTGO} from "./predicateTGO";
import {predicateTQueryInsert} from "./predicateTQueryInsert";
import {predicateTQuerySelect} from "./predicateTQuerySelect";
import {predicateTQueryUpdate} from "./predicateTQueryUpdate";
import {eof} from "../../BaseParser/Predicates/eof";


export function * predicateValidStatementsInFunction(callback) {

    let result;

    let endOfStatement = oneOf([whitespaceOrNewLine, str(";"), eof], "");

    let stType = yield checkAhead([oneOf([
        checkSequence([str("--")]),
        checkSequence([str("BEGIN"), whitespaceOrNewLine]),
        checkSequence([str("BREAK"), endOfStatement]),
        checkSequence([str("DEBUGGER"), endOfStatement]),
        checkSequence([str("DECLARE"), whitespaceOrNewLine]),
        checkSequence([str("IF"), whitespaceOrNewLine]),
        checkSequence([str("RETURN"), endOfStatement]),
        checkSequence([str("SELECT"), whitespaceOrNewLine]),
        checkSequence([str("SET"), whitespaceOrNewLine]),
        checkSequence([str("WHILE"), whitespaceOrNewLine])
    ], "")], "");

    if (stType !== undefined) {
        switch ((stType as any[])[0]) {
            case "--":
                result = yield predicateTComment;
                break;
            case "BEGIN":
                result = yield predicateTBeginEnd;
                break;
            case "BREAK":
                result = yield predicateTBreak;
                break;
            case "DEBUGGER":
                result = yield predicateTDebugger;
                break;
            case "DECLARE":
                result = yield predicateTVariableDeclaration;
                break;
            case "IF":
                result = yield predicateTIf;
                break;
            case "RETURN":
                result = yield predicateReturnValue;
                break;
            case "SELECT":
                result = yield predicateTQuerySelect;
                break;
            case "SET":
                result = yield predicateTVariableAssignment;
                break;
            case "WHILE":
                result = yield predicateTWhile;
                break;
        }
    } else {
        result = yield predicateTQueryFunctionCall;
    }

    yield returnPred(result);

}