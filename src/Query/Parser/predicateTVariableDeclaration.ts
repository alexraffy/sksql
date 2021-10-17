import {predicateTVariable} from "./predicateTVariable";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {literal} from "../../BaseParser/Predicates/literal";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TVariableDeclaration} from "../Types/TVariableDeclaration";
import {predicateTDate} from "./predicateTDate";

/*
    tries to parse a variable declaration
    DECLARE @variable TYPE = EXPRESSION
 */
export const predicateTVariableDeclaration = function *(callback) {
    if (callback === "isGenerator") {
        return;
    }
    const declare = yield str("DECLARE");
    yield whitespace;
    const varname = yield predicateTVariable;
    yield whitespace;
    const vartype = yield literal;
    yield maybe(whitespace);
    const eq = yield maybe(str("="));
    yield maybe(whitespace);
    const value = yield maybe(oneOf([predicateTQueryExpression, predicateTColumn, predicateTDate, predicateTString, predicateTLiteral, predicateTNumber], "An expression"));
    yield maybe(whitespace);
    yield maybe(str(";"));
    yield returnPred(
        {
            kind: "TVariableDeclaration",
            name: varname,
            type: vartype,
            value: value
        } as TVariableDeclaration
    )

}