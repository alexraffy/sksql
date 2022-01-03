import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTString} from "./predicateTString";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNumber} from "./predicateTNumber";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {predicateTComparison} from "./predicateTComparison";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryComparison} from "../Types/TQueryComparison";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTArray} from "./predicateTArray";
import {instanceOfTComparison} from "../Guards/instanceOfTComparison";
import {predicateTDate} from "./predicateTDate";
import {predicateTDateTime} from "./predicateTDateTime";
import {predicateTTime} from "./predicateTTime";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";

/*
    tries to parse a comparison statement
    returns a TQueryComparison containing the left and right expressions and the comparison enum

 */
export const predicateTQueryComparison = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    const left = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall, predicateTVariable, predicateTBoolValue, predicateTColumn, predicateTDateTime, predicateTDate, predicateTTime, predicateTString, predicateTLiteral, predicateTNumber], "");
    yield maybe(atLeast1(whitespaceOrNewLine));
    let comparison = yield predicateTComparison;
    yield maybe(atLeast1(whitespaceOrNewLine));
    let right;
    if (instanceOfTComparison(comparison) && comparison.value.toUpperCase() === "IN") {
        right = yield predicateTArray;
    } else {
        right = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall, predicateTVariable, predicateTBoolValue, predicateTColumn, predicateTDateTime, predicateTDate, predicateTTime, predicateTString, predicateTLiteral, predicateTNumber], "");
    }

    yield returnPred(
        {
            kind: "TQueryComparison",
            left: left,
            comp: comparison,
            right: right
        } as TQueryComparison
    );
}