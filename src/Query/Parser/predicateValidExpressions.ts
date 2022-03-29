
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTCast} from "./predicateTCast";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNull} from "./predicateTNull";
import {predicateTString} from "./predicateTString";
import {predicateTDateTime} from "./predicateTDateTime";
import {predicateTDate} from "./predicateTDate";
import {predicateTTime} from "./predicateTTime";
import {predicateTNumber} from "./predicateTNumber";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTQuerySelect} from "./predicateTQuerySelect";
import {checkSequence} from "../../BaseParser/Predicates/checkSequence";
import {str} from "../../BaseParser/Predicates/str";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {literal} from "../../BaseParser/Predicates/literal";
import {predicateTComment} from "./predicateTComment";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {predicateTCount} from "./predicateTCount";
import {predicateTCaseWhen} from "./predicateTCaseWhen";


export function * predicateValidExpressions(callback) {

    let result;

    let gotComment = yield exitIf(str("--"));
    if (gotComment) {
        result = yield predicateTComment;
        yield returnPred(result);
        return;
    }

    let gotSelectSubQuery = yield exitIf(checkSequence([maybe(str("(")), maybe(atLeast1(whitespaceOrNewLine)), str("SELECT"), whitespaceOrNewLine]))
    if (gotSelectSubQuery) {
        let gotOpeningPar = yield maybe(str("("));
        yield maybe(atLeast1(whitespaceOrNewLine));
        result = yield predicateTQuerySelect;
        if (gotOpeningPar) {
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield maybe(str(")"));
        }
        yield returnPred(result);
        return;
    }

    let gotCount = yield exitIf(checkSequence([str("COUNT"), maybe(atLeast1(whitespaceOrNewLine)), str("(")]));
    if (gotCount) {
        result = yield predicateTCount;
        yield returnPred(result);
        return;
    }

    let gotCast = yield exitIf(checkSequence([str("CAST"), maybe(atLeast1(whitespaceOrNewLine)), str("(")]));
    if (gotCast) {
        result = yield predicateTCast;
        yield returnPred(result);
        return;
    }
    let gotVar = yield exitIf(checkSequence([str("@"), literal]));
    if (gotVar) {
        result = yield predicateTVariable;
        yield returnPred(result);
        return;
    }
    let gotBoolValue = yield exitIf(oneOf([str("TRUE"), str("FALSE")], ""));
    if (gotBoolValue) {
        result = yield predicateTBoolValue;
        yield returnPred(result);
        return;
    }
    let gotNull = yield exitIf(str("NULL"));
    if (gotNull) {
        result = yield predicateTNull;
        yield returnPred(result);
        return;
    }

    let gotCase = yield exitIf(checkSequence([str("CASE"), oneOf([whitespaceOrNewLine, str("(")], "")]));
    if (gotCase) {
        result = yield predicateTCaseWhen;
        yield returnPred(result);
        return;
    }


    let gotFunctionCall = yield exitIf(checkSequence([literal, maybe(atLeast1(whitespaceOrNewLine)), str("(")]));
    if (gotFunctionCall) {
        result = yield predicateTQueryFunctionCall;
        yield returnPred(result);
        return;
    }


    let ret = yield oneOf([
        predicateTDateTime,
        predicateTDate,
        predicateTTime,
        predicateTColumn,
        predicateTLiteral,
        predicateTNumber,
        predicateTString
        //predicateTArray
    ], "");

    yield returnPred(ret);



}