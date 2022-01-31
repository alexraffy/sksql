import {TFuncGen} from "../../BaseParser/parse";
import {literal} from "../../BaseParser/Predicates/literal";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {either} from "../../BaseParser/Predicates/either";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TLiteral} from "../Types/TLiteral";
import {TString} from "../Types/TString";
import {TNumber} from "../Types/TNumber";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {TColumn} from "../Types/TColumn";
import {predicateTColumn} from "./predicateTColumn";
import {TBoolValue} from "../Types/TBoolValue";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {TVariable} from "../Types/TVariable";
import {TDate} from "../Types/TDate";
import {predicateTDate} from "./predicateTDate";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {TDateTime} from "../Types/TDateTime";
import {TTime} from "../Types/TTime";
import {predicateTDateTime} from "./predicateTDateTime";
import {predicateTTime} from "./predicateTTime";
import {TValidExpressions} from "../Types/TValidExpressions";
import {predicateValidExpressions} from "./predicateValidExpressions";
import {predicateTParenthesisGroup} from "./predicateTParenthesisGroup";

/*
    tries to parse a function call
    myFunction(param1,param2...)
 */
export const predicateTQueryFunctionCall: TFuncGen = function*(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    const fnName = yield literal;
    let parameters: (TQueryExpression | TValidExpressions)[] = [];
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");
    yield maybe(atLeast1(whitespaceOrNewLine));
    const param1: (TQueryExpression | TValidExpressions) = yield maybe(oneOf(
        [predicateTQueryExpression, predicateTParenthesisGroup,  predicateValidExpressions], "a list of parameters"));
    if (param1 !== undefined) {
        parameters.push(param1);
    }
    yield maybe(atLeast1(whitespaceOrNewLine));

    let extraParamOrEnd = yield maybe(str(","));
    while (extraParamOrEnd===",") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        const extraParam: (TQueryExpression | TValidExpressions) = yield oneOf(
            [predicateTQueryExpression, predicateTParenthesisGroup, predicateValidExpressions], "a list of parameters");
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
        }
    } as TQueryFunctionCall)
}