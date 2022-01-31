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
import {predicateTDateTime} from "./predicateTDateTime";
import {predicateTTime} from "./predicateTTime";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTColumnType} from "./predicateTColumnType";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateValidExpressions} from "./predicateValidExpressions";
import {predicateTParenthesisGroup} from "./predicateTParenthesisGroup";

/*
    tries to parse a variable declaration
    DECLARE @variable TYPE = EXPRESSION
 */
export const predicateTVariableDeclaration = function *(callback) {
    if (callback === "isGenerator") {
        return;
    }
    let ret : TVariableDeclaration = {
        kind: "TVariableDeclaration",
        declarations: []
    };

    const declare = yield str("DECLARE");

    let gotMore = ",";
    while (gotMore === ",") {
        yield atLeast1(whitespaceOrNewLine);
        const varname = yield predicateTVariable;
        yield atLeast1(whitespaceOrNewLine);
        const vartype = yield predicateTColumnType;
        yield maybe(atLeast1(whitespaceOrNewLine));
        const eq = yield maybe(str("="));
        yield maybe(atLeast1(whitespaceOrNewLine));
        const value = yield maybe(oneOf([predicateTQueryExpression, predicateTParenthesisGroup,  predicateValidExpressions], ""));
        yield maybe(atLeast1(whitespaceOrNewLine));

        ret.declarations.push(
            {
                name: varname,
                type: vartype,
                value: value
            }
        );

        gotMore = yield maybe(str(","));
    }
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield returnPred(ret);

}