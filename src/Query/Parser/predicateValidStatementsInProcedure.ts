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
import {checkAhead} from "../../BaseParser/Predicates/checkAhead";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {predicateTQueryCreateTable} from "./predicateTQueryCreateTable";
import {predicateTQueryCreateFunction} from "./predicateTQueryCreateFunction";
import {predicateTQueryCreateProcedure} from "./predicateTQueryCreateProcedure";
import {predicateTGO} from "./predicateTGO";
import {eof} from "../../BaseParser/Predicates/eof";


export function * predicateValidStatementsInProcedure(callback) {

    let result;

    let endOfStatement = oneOf([whitespaceOrNewLine, str(";"), eof], "");

    let stType = yield checkAhead([oneOf([
        checkSequence([str("--")]),
        checkSequence([str("ALTER"), whitespaceOrNewLine]),
        checkSequence([str("BEGIN"), whitespaceOrNewLine]),
        checkSequence([str("BREAK"), endOfStatement]),
        checkSequence([str("CREATE"), whitespaceOrNewLine]),
        checkSequence([str("DEBUGGER"), endOfStatement]),
        checkSequence([str("DECLARE"), whitespaceOrNewLine]),
        checkSequence([str("DELETE"), whitespaceOrNewLine]),
        checkSequence([str("DROP"), whitespaceOrNewLine]),
        checkSequence([str("EXECUTE"), whitespaceOrNewLine]),
        checkSequence([str("EXEC"), whitespaceOrNewLine]),
        checkSequence([str("GO"), endOfStatement]),
        checkSequence([str("IF"), whitespaceOrNewLine]),
        checkSequence([str("INSERT"), whitespaceOrNewLine]),
        checkSequence([str("RETURN"), endOfStatement]),
        checkSequence([str("SELECT"), whitespaceOrNewLine]),
        checkSequence([str("SET"), whitespaceOrNewLine]),
        checkSequence([str("TRUNCATE"), whitespaceOrNewLine]),
        checkSequence([str("UPDATE"), whitespaceOrNewLine]),
        checkSequence([str("WHILE"), whitespaceOrNewLine])
    ], "")], "");

    if (stType !== undefined) {
        switch ((stType as any[])[0]) {
            case "--":
                result = yield predicateTComment;
                break;
            case "ALTER":
            {
                let stAlter = yield checkAhead([checkSequence([
                    str("ALTER"),
                    atLeast1(whitespaceOrNewLine),
                    oneOf([
                        str("TABLE"),
                        str("FUNCTION"),
                        str("PROCEDURE")
                    ],"")
                ])], "");
                if (stAlter === undefined) { yield str("ALTER TABLE, ALTER FUNCTION or ALTER PROCEDURE");}
                if ((stAlter as any[])[2] === "TABLE") {
                    result = yield predicateTQueryCreateTable;
                }
                if ((stAlter as any[])[2] === "FUNCTION") {
                    result = yield predicateTQueryCreateFunction;
                }
                if ((stAlter as any[])[2] === "PROCEDURE") {
                    result = yield predicateTQueryCreateProcedure;
                }
            }
                break;
            case "BEGIN":
                result = yield predicateTBeginEnd;
                break;
            case "BREAK":
                result = yield predicateTBreak;
                break;
            case "CREATE":
            {
                let stCreate = yield checkAhead([checkSequence([
                    str("CREATE"),
                    atLeast1(whitespaceOrNewLine),
                    oneOf([
                        str("TABLE"),
                        str("FUNCTION"),
                        str("PROCEDURE")
                    ],"")
                ])], "");
                if (stCreate === undefined) { yield str("CREATE TABLE, CREATE FUNCTION or CREATE PROCEDURE");}
                if ((stCreate as any[])[2] === "TABLE") {
                    result = yield predicateTQueryCreateTable;
                }
                if ((stCreate as any[])[2] === "FUNCTION") {
                    result = yield predicateTQueryCreateFunction;
                }
                if ((stCreate as any[])[2] === "PROCEDURE") {
                    result = yield predicateTQueryCreateProcedure;
                }
            }
                break;
            case "DEBUGGER":
                result = yield predicateTDebugger;
                break;
            case "DECLARE":
                result = yield predicateTVariableDeclaration;
                break;
            case "DELETE":
                result = yield predicateTQueryDelete;
                break;
            case "DROP":
            {
                let stDrop = yield checkAhead([checkSequence([
                    str("DROP"),
                    atLeast1(whitespaceOrNewLine),
                    oneOf([
                        str("TABLE"),
                        str("FUNCTION"),
                        str("PROCEDURE")
                    ],"")
                ])], "");
                if (stDrop === undefined) { yield str("DROP TABLE, DROP FUNCTION or DROP PROCEDURE");}
                if ((stDrop as any[])[2] === "TABLE") {
                    result = yield predicateTQueryDrop;
                }
                if ((stDrop as any[])[2] === "FUNCTION") {
                    result = yield predicateTQueryDrop;
                }
                if ((stDrop as any[])[2] === "PROCEDURE") {
                    result = yield predicateTQueryDrop;
                }
            }
                break;
            case "EXECUTE":
            case "EXEC":
                result = yield predicateTExecute;
                break;
            case "GO":
                result = yield predicateTGO;
                break;
            case "IF":
                result = yield predicateTIf;
                break;
            case "INSERT":
                result = yield predicateTQueryInsert;
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
            case "TRUNCATE":
                result = yield str("TRUNCATE NOT IMPLEMENTED");
                break;
            case "UPDATE":
                result = yield predicateTQueryUpdate;
                break;
            case "WHILE":
                result = yield predicateTWhile;
                break;
        }
    } else {
        result = yield predicateTQueryFunctionCall;
    }

    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield returnPred(result);

}