import {kQueryComparison} from "../Enums/kQueryComparison";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TComparison} from "../Types/TComparison";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTNull} from "./predicateTNull";

/*
    tries to parse a comparison between two expression
 */
export const predicateTComparison = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    let not = yield maybe(str("NOT"));
    if (not !== undefined && not.toUpperCase() === "NOT") {
        yield maybe(atLeast1(whitespaceOrNewLine));
    }

    let ret = yield oneOf([str("IS"), str("<>"), str("<="), str("<"), str(">="), str(">"), str("IN"), str("BETWEEN"), str("LIKE"), str("=")], "a test operation: [NOT] =, <>, <=, <, >=, >, IN, BETWEEN, LIKE");

    if (ret !== undefined && ret.toUpperCase() === "IS") {
        yield atLeast1(whitespaceOrNewLine);
        if (not === undefined) {
            not = yield maybe(str("NOT"));
            if (not !== undefined && not.toUpperCase() === "NOT") {
                yield maybe(atLeast1(whitespaceOrNewLine));
            }
        }

        yield returnPred(
            {
                kind: "TComparison",
                negative: (not === undefined) ? false : (not === "NOT"),
                value: kQueryComparison.equal
            } as TComparison
        )
        return;
    }

    let comp: kQueryComparison;
    switch (ret.toUpperCase()) {
        case "=":
            comp = kQueryComparison.equal;
            break;
        case "<>":
            comp = kQueryComparison.different;
            break;
        case "<=":
            comp = kQueryComparison.inferiorEqual;
            break;
        case "<":
            comp = kQueryComparison.inferior;
            break;
        case ">=":
            comp = kQueryComparison.superiorEqual;
            break;
        case ">":
            comp = kQueryComparison.superior;
            break;
        case "IN":
            comp = kQueryComparison.in;
            break;
        case "BETWEEN":
            comp = kQueryComparison.between;
            break;
        case "LIKE":
            comp = kQueryComparison.like;
            break;
    }
    yield returnPred(
        {
            kind: "TComparison",
            negative: (not === undefined) ? false : (not === "NOT"),
            value: comp
        } as TComparison
    )
}