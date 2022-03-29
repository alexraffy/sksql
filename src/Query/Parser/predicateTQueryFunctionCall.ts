import {TFuncGen} from "../../BaseParser/parse";
import {literal} from "../../BaseParser/Predicates/literal";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TQueryExpression} from "../Types/TQueryExpression";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {TValidExpressions} from "../Types/TValidExpressions";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {exitIf} from "../../BaseParser/Predicates/exitIf";


/*
    tries to parse a function call
    myFunction(param1,param2...)
 */
export const predicateTQueryFunctionCall: TFuncGen = function*(callback) {

    const fnName = yield literal;
    let parameters: (TQueryExpression | TValidExpressions)[] = [];
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");
    yield maybe(atLeast1(whitespaceOrNewLine));

    // if its an aggregate function we maybe have DISTINCT here
    const gotDistinct = yield exitIf(checkSequence([str("DISTINCT"), atLeast1(whitespaceOrNewLine)]));
    if (gotDistinct) {
        yield str("DISTINCT");
        yield atLeast1(whitespaceOrNewLine);
    }

    const param1: (TQueryExpression | TValidExpressions) = yield maybe(predicateTQueryExpression);
    if (param1 !== undefined) {
        parameters.push(param1);
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    let extraParamOrEnd = yield maybe(str(","));
    while (extraParamOrEnd===",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        const extraParam: (TQueryExpression | TValidExpressions) = yield predicateTQueryExpression;
        parameters.push(extraParam);
        yield maybe(atLeast1(whitespaceOrNewLine));
        extraParamOrEnd = yield maybe(str(","));
    }
    yield str(")");
    yield returnPred({
        kind: "TQueryFunctionCall",
        value: {
            name: fnName,
            parameters: parameters
        },
        distinct: gotDistinct
    } as TQueryFunctionCall)
}