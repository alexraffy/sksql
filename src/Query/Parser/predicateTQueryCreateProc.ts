import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";


export function * predicateTQueryCreateProc(callback) {

    yield str("CREATE");
    yield atLeast1(whitespaceOrNewLine);
    yield str("PROCEDURE");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("(");

    yield str(")");





}