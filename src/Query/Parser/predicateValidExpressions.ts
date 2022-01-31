import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTCast} from "./predicateTCast";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {predicateTBreak} from "./predicateTBreak";
import {predicateTColumn} from "./predicateTColumn";
import {predicateTLiteral} from "./predicateTLiteral";
import {predicateTNull} from "./predicateTNull";
import {predicateTString} from "./predicateTString";
import {predicateTDateTime} from "./predicateTDateTime";
import {predicateTDate} from "./predicateTDate";
import {predicateTTime} from "./predicateTTime";
import {predicateTNumber} from "./predicateTNumber";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTArray} from "./predicateTArray";


export function * predicateValidExpressions(callback) {


    let ret = yield oneOf([
        predicateTCast,
        predicateTQueryFunctionCall,
        predicateTVariable,
        predicateTBoolValue,
        predicateTDateTime,
        predicateTDate,
        predicateTTime,
        predicateTNull,
        predicateTColumn,
        predicateTLiteral,
        predicateTNumber,
        predicateTString,
        predicateTArray
    ], "");

    yield returnPred(ret);



}