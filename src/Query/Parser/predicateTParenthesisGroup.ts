import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateValidExpressions} from "./predicateValidExpressions";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {kQueryExpressionOp} from "../Enums/kQueryExpressionOp";
import {TValidExpressions} from "../Types/TValidExpressions";


export function * predicateTParenthesisGroup(callback) {

    yield str("(");
    yield maybe(atLeast1(whitespaceOrNewLine));

    let left = yield oneOf([predicateTParenthesisGroup, predicateTQueryExpression, predicateValidExpressions], "");
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield maybe(atLeast1(whitespaceOrNewLine));


    yield str(")");
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred(left)





}