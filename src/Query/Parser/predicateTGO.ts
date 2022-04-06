import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {TComment} from "../Types/TComment";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";

// parse a GO op
//
// This is just replaced with a comment at the moment as the whole query is parsed before execution.
// The correct behaviour will be to stop parsing after the go, execute and continue parsing again.

export function * predicateTGO() {

    yield str("GO");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));
    yield returnPred({
        kind: "TComment",
        comment: "GO"
    } as TComment)
}