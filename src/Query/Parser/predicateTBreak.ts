import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TBreak} from "../Types/TBreak";


export function * predicateTBreak(callback) {

    yield str("BREAK");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"))
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred({
        kind: "TBreak"
    } as TBreak)

}