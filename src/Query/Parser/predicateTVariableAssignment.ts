import {TFuncGen} from "../../BaseParser/parse";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";

import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTString} from "./predicateTString";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {predicateTVariable} from "./predicateTVariable";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TVariableAssignment} from "../Types/TVariableAssignment";
import {predicateTDate} from "./predicateTDate";
import {predicateTDateTime} from "./predicateTDateTime";
import {predicateTTime} from "./predicateTTime";

/*
    tries to parse a variable assignment
    SET @variable = EXPRESSION
    or
    SELECT ... @variable = EXPRESSION ... FROM ...
 */
export const predicateTVariableAssignment: TFuncGen = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return "";
    }
    yield maybe(str("SET"));
    yield maybe(whitespace);
    const varname = yield predicateTVariable;
    yield maybe(whitespace);
    const assign = yield str("=");
    yield maybe(whitespace);
    const value = yield oneOf([predicateTQueryExpression, predicateTColumn, predicateTDateTime, predicateTDate, predicateTTime, predicateTString, predicateTLiteral, predicateTNumber], "An expression");
    yield maybe(whitespace);
    // exit on , or FROM without consuming the characters
    yield exitIf(oneOf([str(","), str("FROM"), str("AS")], ""));
    yield returnPred(
        {
            kind: "TVariableAssignment",
            name: {
                kind: "TVariable",
                name: varname
            },
            value: value
        } as TVariableAssignment
    )
}
