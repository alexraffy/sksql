import {TFuncGen} from "../../BaseParser/parse";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {str} from "../../BaseParser/Predicates/str";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryExpression} from "../Types/TQueryExpression";
import {kQueryExpressionOp} from "../Enums/kQueryExpressionOp";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TLiteral} from "../Types/TLiteral";
import {TString} from "../Types/TString";
import {TNumber} from "../Types/TNumber";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {TColumn} from "../Types/TColumn";
import {predicateTColumn} from "./predicateTColumn";
import {TBoolValue} from "../Types/TBoolValue";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {TVariable} from "../Types/TVariable";
import {predicateTVariable} from "./predicateTVariable";
import {TDate} from "../Types/TDate";
import {predicateTDate} from "./predicateTDate";

/*
    tries to parse an expression

    function(parameters) + EXPRESSION
    variable - EXPRESSION
    true + EXPRESSION
    "HELLO " + "WORLD"
    12 * 145
    ...

 */
export const predicateTQueryExpression: TFuncGen = function*(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }

    const left: TQueryFunctionCall | TVariable | TBoolValue | TColumn | TDate | TString | TLiteral | TNumber = yield oneOf(
        [predicateTQueryFunctionCall, predicateTVariable, predicateTBoolValue,
            predicateTColumn, predicateTDate, predicateTString, predicateTLiteral, predicateTNumber], "a function call, a literal or a number");


    yield maybe(whitespace);
    const sSign = yield oneOf([
        str("+"), str("-"), str("*"), str("/")
    ], "a +,-,*,/");
    let sign: kQueryExpressionOp = kQueryExpressionOp.add;
    switch (sSign) {
        case "-":
            sign = kQueryExpressionOp.minus;
            break;
        case "*":
            sign = kQueryExpressionOp.mul;
            break;
        case "/":
            sign = kQueryExpressionOp.div;
            break;
    }
    yield maybe(whitespace);


    const right: TQueryFunctionCall | TQueryExpression | TVariable | TBoolValue | TColumn | TDate | TString | TLiteral | TNumber = yield oneOf([
        predicateTQueryFunctionCall, predicateTQueryExpression, predicateTVariable, predicateTBoolValue,
        predicateTColumn, predicateTDate, predicateTString, predicateTLiteral, predicateTNumber], "a function call, an expression, a literal or a number");

    yield returnPred(
        {
            kind: "TQueryExpression",
            value: {
                left: left,
                op: sign,
                right: right
            }
        } as TQueryExpression
    );
}
