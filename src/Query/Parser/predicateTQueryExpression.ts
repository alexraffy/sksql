import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {predicateValidExpressions} from "./predicateValidExpressions";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {kQueryExpressionOp} from "../Enums/kQueryExpressionOp";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TValidExpressions} from "../Types/TValidExpressions";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {eof, isEOF} from "../../BaseParser/Predicates/eof";
import {TParserError} from "../../API/TParserError";
import {TNumber} from "../Types/TNumber";
import {TBetween} from "../Types/TBetween";
import {instanceOfTBetween} from "../Guards/instanceOfTBetween";
import {predicateTArray} from "./predicateTArray";



export function * predicateTQueryExpression() {

    let endOfStatement = oneOf([whitespaceOrNewLine, str(";"), eof], "");

    let stopAt = [
        checkSequence([str("FROM"), atLeast1(whitespaceOrNewLine)]),
        checkSequence([str("WHERE"), atLeast1(whitespaceOrNewLine)]),
        checkSequence([str("ORDER"), atLeast1(whitespaceOrNewLine), str("BY")]),
        checkSequence([str("GROUP"), atLeast1(whitespaceOrNewLine), str("BY")]),
        checkSequence([str("HAVING"), whitespaceOrNewLine]),
        checkSequence([str("ASC"), whitespaceOrNewLine]),
        checkSequence([str("ASC"), str(";")]),
        checkSequence([str("ASC"), eof]),
        checkSequence([str("DESC"), whitespaceOrNewLine]),
        checkSequence([str("DESC"), str(";")]),
        checkSequence([str("DESC"), eof]),
        checkSequence([str("AS"), atLeast1(whitespaceOrNewLine)]),
        str(";"), str(","),
        checkSequence([str("--")]),
        checkSequence([str("ALTER"), whitespaceOrNewLine]),
        checkSequence([str("BEGIN"), whitespaceOrNewLine]),
        checkSequence([str("END"), whitespaceOrNewLine]),
        checkSequence([str("ELSE"), whitespaceOrNewLine]),
        checkSequence([str("BREAK"), endOfStatement]),
        checkSequence([str("CREATE"), whitespaceOrNewLine]),
        checkSequence([str("DEBUGGER"), endOfStatement]),
        checkSequence([str("DECLARE"), whitespaceOrNewLine]),
        checkSequence([str("DELETE"), whitespaceOrNewLine]),
        checkSequence([str("DROP"), whitespaceOrNewLine]),
        checkSequence([str("EXECUTE"), whitespaceOrNewLine]),
        checkSequence([str("EXEC"), whitespaceOrNewLine]),
        checkSequence([str("GO"), endOfStatement]),
        checkSequence([str("IF"), whitespaceOrNewLine]),
        checkSequence([str("INSERT"), whitespaceOrNewLine]),
        checkSequence([str("RETURN"), endOfStatement]),
        //checkSequence([str("CASE"), oneOf([whitespaceOrNewLine, str("(")], "")]),
        checkSequence([str("WHEN"), oneOf([whitespaceOrNewLine, str("(")], "")]),
        checkSequence([str("THEN"), oneOf([whitespaceOrNewLine, str("(")], "")]),
        checkSequence([str("END"), oneOf([whitespaceOrNewLine, str(",")], "")]),
        checkSequence([str("SET"), whitespaceOrNewLine]),
        checkSequence([str("TRUNCATE"), whitespaceOrNewLine]),
        checkSequence([str("UPDATE"), whitespaceOrNewLine]),
        checkSequence([str("WHILE"), whitespaceOrNewLine])
    ];

    let chain: (TQueryExpression | TValidExpressions | kQueryExpressionOp)[] = [];

    let gotAtLeastOneTerm = false;
    let numParenthesisGroup = 0;
    while (1) {
        let bisEOF = yield isEOF;
        if (bisEOF === true) {
            break;
        }
        let breakNow = yield exitIf(oneOf(stopAt, ""));
        if (breakNow) {
            break;
        }

        if (numParenthesisGroup === 0) {
            const hasSelect = yield exitIf(checkSequence([str("SELECT"), whitespaceOrNewLine]));
            if (hasSelect === true) {
                break;
            }
        }

        let gotSubSelect = yield exitIf(checkSequence([str("("), maybe(atLeast1(whitespaceOrNewLine)), str("SELECT"), atLeast1(whitespaceOrNewLine)] ));
        if (gotSubSelect) {
            let subSelect = yield predicateValidExpressions;
            chain.push(subSelect);
            continue;
        }

        let gotParenthesis = yield exitIf(str("("));
        if (gotParenthesis) {
            numParenthesisGroup++;
            chain.push(yield str("("));
            continue;
        }
        gotParenthesis = yield exitIf(str(")"));
        if (gotParenthesis) {
            numParenthesisGroup--;
            if (numParenthesisGroup < 0) {
                // this parenthesis is not part of the expression, probably the end of a function
                break;
            }
            chain.push(yield str(")"));
            continue;
        }

            let hasTerm = yield exitIf(oneOf([str("+"), str("-"), str("*"), str("/"), str("%"),
                str("<>"), str("!="), str("<="), str("<"), str("=="), str(">="), str(">"), str("="),
                checkSequence([str("AND"), atLeast1(whitespaceOrNewLine), str("NOT"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("AND"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("OR"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("NOT"), atLeast1(whitespaceOrNewLine), str("LIKE"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("NOT"), atLeast1(whitespaceOrNewLine), str("BETWEEN"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("NOT"), atLeast1(whitespaceOrNewLine), str("IN"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("IS"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("LIKE"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("BETWEEN"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                checkSequence([str("IN"), oneOf([whitespaceOrNewLine,str("(")], "")]),
                str("("),
                str(")")
            ], ""));
            if (hasTerm === true) {
                gotAtLeastOneTerm = true;
                const sSign = yield oneOf([
                    str("+"), str("-"), str("*"), str("/"), str("%"),
                    str("<>"), str("!="), str("<="), str("<"), str("=="), str(">="), str(">"), str("="),
                    checkSequence([str("AND"), atLeast1(whitespaceOrNewLine), str("NOT")]),
                    str("AND"), str("OR"),
                    checkSequence([str("NOT"), atLeast1(whitespaceOrNewLine), str("LIKE")]),
                    checkSequence([str("NOT"), atLeast1(whitespaceOrNewLine), str("BETWEEN")]),
                    checkSequence([str("NOT"), atLeast1(whitespaceOrNewLine), str("IN")]),
                    checkSequence([str("IS"), atLeast1(whitespaceOrNewLine)]),
                    str("LIKE"),
                    str("BETWEEN"),
                    str("IN"),
                    str("("),
                    str(")")
                ], "a +,-,*,/");
                let sign = kQueryExpressionOp.add;
                if (typeof sSign === "object") {
                    if (sSign[0].toUpperCase() === "AND") {
                        sign = kQueryExpressionOp.boolAndNot;
                    }
                    if (sSign[0].toUpperCase() === "NOT" && sSign[2].toUpperCase() === "LIKE") {
                        sign = kQueryExpressionOp.notLike;
                    }
                    if (sSign[0].toUpperCase() === "NOT" && sSign[2].toUpperCase() === "BETWEEN") {
                        sign = kQueryExpressionOp.notBetween;
                    }
                    if (sSign[0].toUpperCase() === "NOT" && sSign[2].toUpperCase() === "IN") {
                        sign = kQueryExpressionOp.notIn;
                    }
                    if (sSign[0].toUpperCase() === "IS") {
                        let notNull = yield maybe(str("NOT"));
                        if (notNull !== undefined) {
                            yield atLeast1(whitespaceOrNewLine);
                        }
                        const mustBeNullAfterIs = yield exitIf(str("NULL"));
                        if (mustBeNullAfterIs === false) {
                            throw new TParserError("IS and IS NOT must be followed by NULL.");
                        }
                        sign = (notNull === undefined) ? kQueryExpressionOp.isNull : kQueryExpressionOp.isNotNull;
                    }
                } else {
                    switch (sSign.toUpperCase()) {
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
                        case "<>":
                        case "!=":
                            sign = kQueryExpressionOp.dif;
                            break;
                        case "<":
                            sign = kQueryExpressionOp.inf;
                            break;
                        case "<=":
                            sign = kQueryExpressionOp.infEq;
                            break;
                        case ">":
                            sign = kQueryExpressionOp.sup;
                            break;
                        case ">=":
                            sign = kQueryExpressionOp.supEq;
                            break;
                        case "==":
                        case "=":
                            sign = kQueryExpressionOp.eq;
                            break;
                        case "LIKE":
                            sign = kQueryExpressionOp.like;
                            break;
                        case "BETWEEN":
                            sign = kQueryExpressionOp.between;
                            break;
                        case "IN":
                            sign = kQueryExpressionOp.in;

                            break;
                        case "AND":
                            sign = kQueryExpressionOp.boolAnd;
                            break;
                        case "OR":
                            sign = kQueryExpressionOp.boolOR;
                            break;
                        default:
                            sign = sSign;
                            break;
                    }
                }
                chain.push(sign);
                yield maybe(atLeast1(whitespaceOrNewLine));
                if (["IN", "NOT IN"].includes(sign.toUpperCase())) {
                    let inArray = yield predicateTArray;
                    if (inArray !== undefined) {
                        chain.push(inArray);
                    }
                    yield maybe(atLeast1(whitespaceOrNewLine));
                }

            } else {
                if (yield exitIf(whitespaceOrNewLine)) {
                    yield maybe(atLeast1(whitespaceOrNewLine));
                } else {
                    let value = yield predicateValidExpressions;
                    if (value !== undefined) {
                        chain.push(value);
                        gotAtLeastOneTerm = true;
                    }
                }
            }

        yield maybe(atLeast1(whitespaceOrNewLine));


    }

    if (chain.length === 1) {
        yield returnPred(chain[0]);
        return;
    }

    let fn = (chain: any[]) => {
        if (chain.length === 1) {
            return;
        }
        let indexParenthesisStart = -1;
        let countParenthesis = 0;
        for (let idx = 0; idx < chain.length; idx++) {
            if (typeof chain[idx] === "string") {
                if (chain[idx] === "(") {
                    if (indexParenthesisStart === -1) {
                        indexParenthesisStart = idx;
                    }
                    countParenthesis++;
                }
                if (chain[idx] === ")") {
                    countParenthesis--;
                    if (countParenthesis === 0) {
                        let subChain = [];
                        for (let i = indexParenthesisStart + 1; i < idx; i++) {
                            subChain.push(chain[i]);
                        }
                        chain.splice(indexParenthesisStart, (idx+1) - indexParenthesisStart);
                        fn(subChain);
                        chain.splice(indexParenthesisStart, 0, ...subChain);
                        idx = 0;
                        indexParenthesisStart = -1;
                    }
                }
            }
        }
        if (countParenthesis > 0) {
            // missing closing parenthesis
            throw new TParserError("Parenthesis mismatch");
        }

        // * and / take precedence so we first scan the array and create group for them
        for (let idx = 0; idx < chain.length - 1; idx++) {
            if (typeof chain[idx] === "string") {
                if (chain[idx] === kQueryExpressionOp.mul || chain[idx] === kQueryExpressionOp.div || chain[idx] === kQueryExpressionOp.modulo) {
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
                if (chain[idx] === "+" || chain[idx] === "-") {
                    let replaceWith : TQueryExpression | TValidExpressions = {
                        kind: "TQueryExpression",
                        value: {
                            left: chain[idx - 1],
                            op: chain[idx],
                            right: chain[idx + 1]
                        }
                    } as TQueryExpression
                    if (replaceWith.value.left === undefined || typeof replaceWith.value.left === "string") {
                        // it's a signed number and not an expression
                        replaceWith = {
                            kind: "TQueryExpression",
                            value: {
                                left: {kind: "TNumber", value: "0"},
                                op: kQueryExpressionOp.minus,
                                right: chain[idx + 1]
                            }
                        } as TQueryExpression;
                        chain.splice(idx + 1, 1);
                        chain.splice(idx, 1, replaceWith);
                    } else {
                        chain.splice(idx + 1, 1);
                        chain.splice(idx, 1);
                        chain.splice(idx - 1, 1, replaceWith);
                    }
                    idx--;
                }
            }
        }
        for (let idx = 0; idx < chain.length - 1; idx++) {
            if (typeof chain[idx] === "string" && [kQueryExpressionOp.between,kQueryExpressionOp.notBetween].includes(chain[idx].toUpperCase())) {
                if (instanceOfTBetween(chain[idx+1])) {
                    break;
                }
                let x = idx+1;
                let l = undefined;
                let r = undefined;
                let rx = 0;
                while (x < chain.length) {
                    if (typeof chain[x] === "string") {
                        if (l === undefined) {
                            l = chain[x-1];
                        } else {
                            if (r === undefined) {
                                r = chain[x - 1]
                                rx = x - 1;
                            }
                        }
                    }
                    x++;
                }
                if (r === undefined) {
                    r = chain[chain.length-1];
                    rx = chain.length-1;
                }
                let bet: TBetween = {
                    kind: "TBetween",
                    a: l,
                    b: r
                };
                chain.splice(idx+1, rx - (idx), bet);
                idx = 0;
            }
        }

        for (let idx = 0; idx < chain.length - 1; idx++) {
            if (typeof chain[idx] === "string") {
                if (["<>", "!=", "<=", ">=", "<", ">", "==", "=", "LIKE", "BETWEEN", "IN", "NOT LIKE", "NOT BETWEEN", "NOT IN", "IS NULL", "IS NOT NULL"].includes(chain[idx] as string)) {
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
                if (["AND NOT", "AND", "OR"].includes(chain[idx] as string)) {
                    let replaceWith = {
                        kind: "TQueryExpression",
                        value: {
                            left: chain[idx -1],
                            op: chain[idx],
                            right: chain[idx + 1]
                        }
                    } as TQueryExpression;
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

    }

    fn(chain);


    yield returnPred(chain[0]);


}