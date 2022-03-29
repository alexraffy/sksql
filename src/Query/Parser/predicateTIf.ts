import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {TIf} from "../Types/TIf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateValidStatementsInProcedure} from "./predicateValidStatementsInProcedure";
import {predicateTQueryExpression} from "./predicateTQueryExpression";


export function * predicateTIf(callback) {

    let ret: TIf = {
        kind: "TIf",
        tests: []
    }

    yield str("IF");
    yield atLeast1(whitespaceOrNewLine);
    const test = yield predicateTQueryExpression;
    yield maybe(atLeast1(whitespaceOrNewLine));

    let op = yield predicateValidStatementsInProcedure;

    ret.tests.push({
        test: test,
        op: [op]
    });

    let gotElse = yield maybe(str("ELSE"));
    if (gotElse !== undefined) {
        yield atLeast1(whitespaceOrNewLine);

        let op = yield predicateValidStatementsInProcedure;
        yield maybe(atLeast1(whitespaceOrNewLine));
        ret.tests.push(
            {
                test: undefined,
                op: [op]
            }
        );
    }


    yield returnPred(ret);


}