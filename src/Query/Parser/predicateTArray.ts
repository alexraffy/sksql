import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTString} from "./predicateTString";
import {predicateTVariable} from "./predicateTVariable";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {TArray} from "../Types/TArray";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTNumber} from "./predicateTNumber";

/*
    tries to parse (FUNCTION | EXPRESSION | STRING | VARIABLE | NUMBER,...)
 */
export const predicateTArray = function*(callback) {
    let ret: TArray = {
        kind: "TArray",
        array: []
    };
    yield str("(");
    let gotMore = ",";
    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let value = yield oneOf([predicateTQueryFunctionCall, predicateTQueryExpression, predicateTString, predicateTVariable, predicateTNumber], "");
        ret.array.push(value);
        yield maybe(atLeast1(whitespaceOrNewLine));
        gotMore = yield maybe(str(","));
    }
    yield str(")");
    yield returnPred(ret);

}