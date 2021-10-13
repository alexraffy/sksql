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
    let parameters: (TQueryExpression | TVariable | TBoolValue | TColumn | TString | TLiteral | TNumber)[] = [];
    yield maybe(whitespace);
    yield str("(");
    const param1: (TQueryExpression | TVariable | TBoolValue | TColumn | TString | TLiteral | TNumber) = yield oneOf(
        [predicateTQueryExpression, predicateTColumn, predicateTString, predicateTLiteral, predicateTNumber], "a list of parameters");
    parameters.push(param1);
    yield maybe(whitespace);

    let extraParamOrEnd = yield either(str(")"), str(","));
    while (extraParamOrEnd===",") {
        yield maybe(whitespace);
        const extraParam: (TQueryExpression | TVariable | TBoolValue | TColumn | TString | TLiteral | TNumber) = yield oneOf(
            [predicateTQueryExpression, predicateTColumn, predicateTString, predicateTLiteral, predicateTNumber], "a list of parameters");
        parameters.push(extraParam);
        yield maybe(whitespace);
        extraParamOrEnd = yield either(str(")"), str(","));
    }

    yield returnPred({
        kind: "TQueryFunctionCall",
        value: {
            name: fnName,
            parameters: parameters
        }
    } as TQueryFunctionCall)
}