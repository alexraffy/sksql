import {str} from "../../BaseParser/Predicates/str";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTString} from "./predicateTString";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {number} from "../../BaseParser/Predicates/number";
import {returnPred} from "../../BaseParser/Predicates/ret";

// called from predicateDBCC
export function * predicateDBCCCheckIdent() {

    yield str("CHECKIDENT");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");
    yield maybe(atLeast1(whitespaceOrNewLine));
    const table = yield predicateTString;
    yield maybe(atLeast1(whitespaceOrNewLine));
    const gotMore = yield maybe(str(","));
    let reseed = false;
    let reseedValue = undefined;
    if (gotMore) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        let gotReseed = yield maybe(oneOf([str("RESEED"), str("NORESEED")], "RESEED, NORESEED OR A NEW SEED VALUE."));
        if (gotReseed !== undefined && gotReseed.toUpperCase() === "RESEED") {
            reseed = true;
        }
        if (gotReseed) {
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str(",");
            yield maybe(atLeast1(whitespaceOrNewLine));
            reseedValue = yield number;
        }
        yield maybe(atLeast1(whitespaceOrNewLine));
    }
    yield str(")");


    yield returnPred({
        kind: "DBCC",
        op: "CHECKIDENT",
        table: table,
        reseed: reseed,
        reseedValue: reseedValue
    });
}