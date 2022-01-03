import {predicateTQueryComparison} from "./predicateTQueryComparison";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryComparisonExpression} from "../Types/TQueryComparisonExpression";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {TQueryComparison} from "../Types/TQueryComparison";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {exitIf} from "../../BaseParser/Predicates/exitIf";

/*
    tries to parse a boolean operation between two or more comparison statements
 */
export const predicateTQueryComparisonExpression = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    let left = yield predicateTQueryComparison;

    yield maybe(atLeast1(whitespaceOrNewLine));
    // check if ORDER BY is not next as it will interfere with the OR operator
    const orderByPresent = yield exitIf(str("ORDER BY"));
    if (orderByPresent === true) {
        yield returnPred(
            left
        );
        return;
    }
    const boolOp = yield maybe(oneOf([str("AND NOT"), str("AND"), str("OR")], ""));
    if (boolOp === undefined) {
        yield returnPred(
            left
        );
        return;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));



    let right = yield oneOf([predicateTQueryComparisonExpression, predicateTQueryComparison], "");

    yield returnPred({
        kind: "TQueryComparisonExpression",
        a: left,
        bool: boolOp,
        b: right
    } as TQueryComparisonExpression);


}