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



/*
    tries to parse a column expression in a select statement
    EXPRESSION | FUNCTION | VARIABLE | BOOL | COLUMN | STRING | LITERAL | NUMBER
    and an optional alias
    AS STRING | LITERAL
 */
export const predicateTQueryColumn = function *(callback) {


    let left = yield oneOf([predicateTStar, predicateTVariableAssignment, predicateTQueryExpression], "an expression or column" );
    yield maybe(atLeast1(whitespaceOrNewLine));
    let as = yield exitIf(checkSequence([str("AS"), whitespaceOrNewLine]));
    let columnName = "";
    if (as === true) {
        yield str("AS");
        yield atLeast1(whitespaceOrNewLine);
        columnName = yield oneOf([predicateTLiteral, predicateTString], "an alias");
    } else {
        switch (left.kind) {
            case "TLiteral":
                columnName = (left as TLiteral).value;
                break;
            case "TColumn":
                columnName = (left as TColumn).column;
                break;
            case "TString":
                columnName = (left as TString).value;
                break;
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