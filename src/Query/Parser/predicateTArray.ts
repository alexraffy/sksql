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
import {predicateTDate} from "./predicateTDate";
import {predicateTQuerySelect} from "./predicateTQuerySelect";

/*
    tries to parse (FUNCTION | EXPRESSION | TDATE | STRING | VARIABLE | NUMBER,...)
 */
export const predicateTArray = function*(callback) {
    let ret: TArray = {
        kind: "TArray",
        array: []
    };
    yield str("(");
    yield maybe(atLeast1(whitespaceOrNewLine));
    let hasSelect = yield maybe(predicateTQuerySelect);
    if (hasSelect !== undefined) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str(")");
        yield returnPred(hasSelect);
        return;
    }
    let gotMore = ",";
    while (gotMore === ",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let value = yield predicateTQueryExpression;
        ret.array.push(value);
        yield maybe(atLeast1(whitespaceOrNewLine));
        gotMore = yield maybe(str(","));
    }
    yield str(")");
    yield returnPred(ret);

}