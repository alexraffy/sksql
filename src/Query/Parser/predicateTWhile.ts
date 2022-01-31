import {str} from "../../BaseParser/Predicates/str";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQueryComparisonExpression} from "./predicateTQueryComparisonExpression";
import {predicateTQueryComparison} from "./predicateTQueryComparison";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {predicateTBeginEnd} from "./predicateTBeginEnd";
import {predicateReturnValue} from "./predicateReturnValue";
import {predicateTVariableAssignment} from "./predicateTVariableAssignment";
import {predicateTBreak} from "./predicateTBreak";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TWhile} from "../Types/TWhile";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTIf} from "./predicateTIf";
import {predicateValidStatementsInFunction} from "./predicateValidStatementsInFunction";
import {predicateValidStatementsInProcedure} from "./predicateValidStatementsInProcedure";


export function * predicateTWhile(callback) {

    yield str("WHILE");
    yield atLeast1(whitespaceOrNewLine);
    const test = yield oneOf([predicateTQueryComparisonExpression, predicateTQueryComparison], "");
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