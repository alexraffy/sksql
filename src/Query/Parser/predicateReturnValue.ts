import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TReturnValue} from "../Types/TReturnValue";
import {predicateValidExpressions} from "./predicateValidExpressions";

// parse a RETURN op in T-SQL

export function * predicateReturnValue(callback) {

    yield str("RETURN");
    yield maybe(atLeast1(whitespaceOrNewLine));
    const value = yield maybe(oneOf([predicateTQueryExpression, predicateValidExpressions], "An expression"));
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));

    yield returnPred({
        kind: "TReturnValue",
        value: value
    } as TReturnValue)


}