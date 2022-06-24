import {predicateDBCCCheckIdent} from "./predicateDBCCCheckIdent";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {maybe} from "../../BaseParser/Predicates/maybe";


export function * predicateDBCC() {
    yield str("DBCC");
    yield atLeast1(whitespaceOrNewLine);
    let ret = yield oneOf([predicateDBCCCheckIdent], "CHECKIDENT");
    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));
    yield returnPred(ret);
}