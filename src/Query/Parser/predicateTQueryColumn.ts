import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {TQueryColumn} from "../Types/TQueryColumn";
import {TColumn} from "../Types/TColumn";
import {TLiteral} from "../Types/TLiteral";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {predicateTStar} from "./predicateTStar";
import {predicateTVariableAssignment} from "./predicateTVariableAssignment";
import {TString} from "../Types/TString";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {eof} from "../../BaseParser/Predicates/eof";
import {predicateParseError} from "../../BaseParser/Predicates/predicateParseError";



/*
    tries to parse a column expression in a select statement
    EXPRESSION | FUNCTION | VARIABLE | BOOL | COLUMN | STRING | LITERAL | NUMBER
    and an optional alias
    AS STRING | LITERAL
 */
export const predicateTQueryColumn = function *(callback) {


    let left = yield oneOf([predicateTStar, predicateTVariableAssignment, predicateTQueryExpression], "an expression or column" );
    if (left === undefined) {
        yield predicateParseError("An expression or column");
        return;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    let as = yield exitIf(checkSequence([str("AS"), whitespaceOrNewLine]));
    let columnName = "";
    if (as === true) {
        yield str("AS");
        yield atLeast1(whitespaceOrNewLine);
        columnName = yield oneOf([predicateTLiteral, predicateTString], "an alias");
    } else {
        // check if we have an alias without AS

        let endOfStatement = oneOf([whitespaceOrNewLine, str(";"), eof], "");
        let stopAt = [
            checkSequence([str("FROM"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("WHERE"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("ORDER"), atLeast1(whitespaceOrNewLine), str("BY")]),
            checkSequence([str("GROUP"), atLeast1(whitespaceOrNewLine), str("BY")]),
            checkSequence([str("HAVING"), whitespaceOrNewLine]),
            checkSequence([str("ASC"), whitespaceOrNewLine]),
            checkSequence([str("ASC"), str(";")]),
            checkSequence([str("ASC"), eof]),
            checkSequence([str("DESC"), whitespaceOrNewLine]),
            checkSequence([str("DESC"), str(";")]),
            checkSequence([str("DESC"), eof]),
            checkSequence([str("AS"), atLeast1(whitespaceOrNewLine)]),
            str(";"), str(","),
            checkSequence([str("--")]),
            checkSequence([str("ALTER"), whitespaceOrNewLine]),
            checkSequence([str("BEGIN"), whitespaceOrNewLine]),
            checkSequence([str("END"), whitespaceOrNewLine]),
            checkSequence([str("ELSE"), whitespaceOrNewLine]),
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
            //checkSequence([str("CASE"), oneOf([whitespaceOrNewLine, str("(")], "")]),
            checkSequence([str("WHEN"), oneOf([whitespaceOrNewLine, str("(")], "")]),
            checkSequence([str("THEN"), oneOf([whitespaceOrNewLine, str("(")], "")]),
            checkSequence([str("END"), oneOf([whitespaceOrNewLine, str(",")], "")]),
            checkSequence([str("SET"), whitespaceOrNewLine]),
            checkSequence([str("TRUNCATE"), whitespaceOrNewLine]),
            checkSequence([str("UPDATE"), whitespaceOrNewLine]),
            checkSequence([str("WHILE"), whitespaceOrNewLine]),
            checkSequence([str("UNION"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("INTERSECT"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("EXCEPT"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("JOIN"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("LEFT"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("RIGHT"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("INNER"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("CROSS"), atLeast1(whitespaceOrNewLine)]),
            checkSequence([str("FULL"), atLeast1(whitespaceOrNewLine)])
        ];
        let noColumn = yield exitIf(oneOf(stopAt, ""));
        let hasColumnName = false;
        if (noColumn === false) {
            hasColumnName = yield exitIf(oneOf([predicateTLiteral, predicateTString], "an alias"));
            if (hasColumnName) {
                columnName = yield oneOf([predicateTLiteral, predicateTString], "an alias");
            }
        }
        if (noColumn === true || hasColumnName === false)
        {

            switch (left.kind) {
                case "TLiteral":
                    columnName = (left as TLiteral).value;
                    break;
                case "TColumn":
                    if ((left as TColumn).table !== undefined && ((left as TColumn).table !== "")) {
                        columnName = (left as TColumn).table + "." + (left as TColumn).column;
                    } else {
                        columnName = (left as TColumn).column;
                    }
                    break;
                case "TString":
                    columnName = (left as TString).value;
                    break;
            }
        }
    }
    yield returnPred(
        {
            kind: "TQueryColumn",
            alias: {kind: "TAlias", name: columnName, alias: columnName},
            expression: left
        } as TQueryColumn
    );
}