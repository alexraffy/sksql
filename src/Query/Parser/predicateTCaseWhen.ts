import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {str} from "../../BaseParser/Predicates/str";
import {TCaseWhen} from "../Types/TCaseWhen";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";

// parse a CASE WHEN op in T-SQL
// supports CASE WHEN <BOOLEAN EXPRESSION> THEN OP WHEN... ELSE ... END
// and CASE <EXPRESSION> WHEN <VALUE> THEN ...

export function * predicateTCaseWhen() {

    let ret: TCaseWhen = {
        kind: "TCaseWhen",
        case: undefined,
        whens: [],
        else: undefined
    } ;

    yield str("CASE");
    yield atLeast1(whitespaceOrNewLine);
    let noCase = yield exitIf(str("WHEN"));
    if (!noCase) {
        ret.case = yield predicateTQueryExpression;
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    let gotMore = yield maybe(str("WHEN"));
    let gotElse = undefined;
    while (gotMore !== undefined || gotElse === undefined) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let w = {test: undefined, ret: undefined};
        w.test = yield predicateTQueryExpression;
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("THEN");
        yield atLeast1(whitespaceOrNewLine);

        w.ret = yield predicateTQueryExpression;
        yield maybe(atLeast1(whitespaceOrNewLine));

        ret.whens.push(w);

        gotElse = yield maybe(str("ELSE"));
        if (gotElse) {
            yield atLeast1(whitespaceOrNewLine);
            ret.else = yield predicateTQueryExpression;
        }
        gotMore = yield maybe(str("WHEN"));
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("END");

    yield returnPred(ret);

}