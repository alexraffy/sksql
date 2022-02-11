import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {TComment} from "../Types/TComment";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";


export function * predicateTGO() {

    yield str("GO");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));
    yield returnPred({
        kind: "TComment",
        comment: "GO"
    } as TComment)
}