import {str} from "../../BaseParser/Predicates/str";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TWhile} from "../Types/TWhile";
import {predicateValidStatementsInProcedure} from "./predicateValidStatementsInProcedure";
import {predicateTQueryExpression} from "./predicateTQueryExpression";


export function * predicateTWhile(callback) {

    yield str("WHILE");
    yield atLeast1(whitespaceOrNewLine);
    const test = yield predicateTQueryExpression; //oneOf([predicateTQueryComparisonExpression, predicateTQueryComparison], "");
    yield maybe(atLeast1(whitespaceOrNewLine));

    let op = yield predicateValidStatementsInProcedure;
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred(
        {
            kind: "TWhile",
            test: test,
            op: [op]
        } as TWhile
    )

}