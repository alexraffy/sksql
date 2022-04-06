import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTColumnType} from "./predicateTColumnType";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {TCast} from "../Types/TCast";
import {predicateTQueryExpression} from "./predicateTQueryExpression";

// parse a CAST(EXPRESSION AS TYPE) op in T-SQL

export function * predicateTCast(callback) {

    yield str("CAST");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");

    let exp = yield predicateTQueryExpression;

    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("AS");
    yield atLeast1(whitespaceOrNewLine);
    let castAs = yield predicateTColumnType;
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str(")");
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred(
        {
            kind: "TCast",
            exp: exp,
            cast: castAs
        } as TCast
    )

}