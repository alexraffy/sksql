import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {instanceOfTStar} from "../Guards/instanceOfTStar";
import {TNumber} from "../Types/TNumber";
import {predicateTStar} from "./predicateTStar";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {TParserError} from "../../API/TParserError";

// parse a COUNT aggregate
// supports *, ALL and DISTINCT

export function * predicateTCount() {

    yield str("COUNT");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");
    yield maybe(atLeast1(whitespaceOrNewLine));
    const flag = yield maybe(oneOf([str("ALL"), str("DISTINCT")], ""));
    yield maybe(atLeast1(whitespaceOrNewLine));
    let expression = yield oneOf(
        [predicateTStar, predicateTQueryExpression], "a list of parameters");
    yield maybe(atLeast1(whitespaceOrNewLine));
    if ((yield exitIf(str(")"))) === false) {
        throw new TParserError("COUNT should have one parameter.");
    }
    yield str(")");

    let isDistinct = false;
    if (flag !== undefined && flag.toUpperCase() === "DISTINCT") {
        isDistinct = true;
    }

    if (instanceOfTStar(expression)) {
        expression = {
            kind: "TNumber",
            value: "1"
        } as TNumber;
    }

    yield returnPred({
        kind: "TQueryFunctionCall",
        value: {
            name: "COUNT",
            parameters: [expression],

        },
        distinct: isDistinct
    } as TQueryFunctionCall)

}