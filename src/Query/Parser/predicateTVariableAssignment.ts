import {TFuncGen} from "../../BaseParser/parse";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTVariable} from "./predicateTVariable";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TVariableAssignment} from "../Types/TVariableAssignment";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";


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
    let hasSet = yield maybe(str("SET"));
    yield maybe(atLeast1(whitespaceOrNewLine));
    const varname = yield predicateTVariable;
    yield maybe(atLeast1(whitespaceOrNewLine));
    const assign = yield str("=");
    yield maybe(atLeast1(whitespaceOrNewLine));
    const value = yield predicateTQueryExpression;
    yield maybe(atLeast1(whitespaceOrNewLine));
    // exit on , or FROM without consuming the characters
    //yield exitIf(oneOf([str(","), str("FROM"), str("AS")], ""));
    if (hasSet !== undefined) {
        yield str(";")
        yield maybe(atLeast1(whitespaceOrNewLine));
    }

    yield returnPred(
        {
            kind: "TVariableAssignment",
            name: varname,
            value: value
        } as TVariableAssignment
    )
}
