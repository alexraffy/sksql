import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTDateTime} from "./predicateTDateTime";
import {predicateTDate} from "./predicateTDate";
import {predicateTTime} from "./predicateTTime";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TReturnValue} from "../Types/TReturnValue";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
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