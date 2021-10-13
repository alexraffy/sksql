import {predicateTQueryComparison} from "./predicateTQueryComparison";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryComparisonExpression} from "../Types/TQueryComparisonExpression";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {TQueryComparison} from "../Types/TQueryComparison";

/*
    tries to parse a boolean operation between two or more comparison statements
 */
export const predicateTQueryComparisonExpression = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    let left = yield predicateTQueryComparison;

    yield maybe(whitespace);
    const boolOp = yield maybe(oneOf([str("AND NOT"), str("AND"), str("OR")], ""));
    yield maybe(whitespace);

    if (boolOp === undefined) {
        yield returnPred(
            left
        );
        return;
    }

    let right = yield oneOf([predicateTQueryComparisonExpression, predicateTQueryComparison], "");

    yield returnPred({
        kind: "TQueryComparisonExpression",
        a: left,
        bool: boolOp,
        b: right
    } as TQueryComparisonExpression);


}