import {TFuncGen} from "../../BaseParser/parse";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {maybe} from "../../BaseParser/Predicates/maybe";
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
import {TDateTime} from "../Types/TDateTime";
import {TTime} from "../Types/TTime";
import {predicateTTime} from "./predicateTTime";
import {predicateTDateTime} from "./predicateTDateTime";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {TValidExpressions} from "../Types/TValidExpressions";
import {predicateValidExpressions} from "./predicateValidExpressions";
import {predicateTParenthesisGroup} from "./predicateTParenthesisGroup";
import {predicateTQueryCreateProc} from "./predicateTQueryCreateProc";
import {exitIf} from "../../BaseParser/Predicates/exitIf";

/*
    tries to parse an expression

    function(parameters) + EXPRESSION
    variable - EXPRESSION
    true + EXPRESSION
    "HELLO " + "WORLD"
    12 * 145
    ...

 */

export function * predicateTQueryExpression(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    let chain: (TQueryExpression | TValidExpressions | kQueryExpressionOp)[] = [];

    let gotAtLeastOneTerm = false;

    while (1) {
        let value = yield maybe(predicateTParenthesisGroup);
        if (value === undefined) {
            value = yield predicateValidExpressions;
        }
        chain.push(value);
        yield maybe(atLeast1(whitespaceOrNewLine));

        let hasTerm = yield exitIf(oneOf([str("+"), str("-"), str("*"), str("/"), str("%")], ""));
        if (hasTerm === true) {
            gotAtLeastOneTerm = true;
            const sSign = yield oneOf([
                str("+"), str("-"), str("*"), str("/"), str("%")
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
                case "%":
                    sign = kQueryExpressionOp.modulo;
                    break;
            }
            chain.push(sign);
            yield maybe(atLeast1(whitespaceOrNewLine));

        } else {
            if (gotAtLeastOneTerm === false) {
                // forcefully fail
                yield oneOf([
                    str("+"), str("-"), str("*"), str("/"), str("%")
                ], "a +,-,*,/");
            }
            break;
        }
    }

    if (chain.length === 1) {
        yield returnPred(chain[0]);
        return;
    }

    // * and / take precedence so we first scan the array and create group for them
    for (let idx = 0; idx < chain.length - 1; idx++) {
        if (typeof chain[idx] === "string") {
            if (chain[idx] === "*" || chain[idx] === "/") {
                let replaceWith = {
                    kind: "TQueryExpression",
                    value: {
                        left: chain[idx - 1],
                        op: chain[idx],
                        right: chain[idx + 1]
                    }
                } as TQueryExpression
                chain.splice(idx + 1, 1);
                chain.splice(idx, 1);
                chain.splice(idx - 1, 1, replaceWith);
                idx--;
            }
        }
    }

    for (let idx = 0; idx < chain.length - 1; idx++) {
        if (typeof chain[idx] === "string") {
            let replaceWith = {
                kind: "TQueryExpression",
                value: {
                    left: chain[idx - 1],
                    op: chain[idx],
                    right: chain[idx + 1]
                }
            } as TQueryExpression
            chain.splice(idx + 1, 1);
            chain.splice(idx, 1);
            chain.splice(idx - 1, 1, replaceWith);
            idx--;
        }
    }

    yield returnPred(chain[0]);

}


export const predicateTQueryExpressionFAULTY: TFuncGen = function*(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }

    let left: TValidExpressions | TQueryExpression = yield maybe(predicateTParenthesisGroup);
    if (left === undefined) {
        left = yield predicateValidExpressions;
    }


    yield maybe(atLeast1(whitespaceOrNewLine));
    const sSign = yield oneOf([
        str("+"), str("-"), str("*"), str("/"), str("%")
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
        case "%":
            sign = kQueryExpressionOp.modulo;
            break;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));


    const right: TValidExpressions = yield oneOf([predicateTQueryExpression, predicateTParenthesisGroup, predicateValidExpressions], "");



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
