import {returnPred} from "../../BaseParser/Predicates/ret";
import {TDebugger} from "../Types/TDebugger";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTString} from "./predicateTString";
import {predicateTQueryExpression} from "./predicateTQueryExpression";


export function * predicateTDebugger(callback) {

    yield str("DEBUGGER");
    yield maybe(atLeast1(whitespaceOrNewLine));
    const gotLabel = yield maybe(str("LABEL"));
    let label = undefined;
    let test = undefined;
    if (gotLabel) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("=");
        yield maybe(atLeast1(whitespaceOrNewLine));
        label = yield predicateTString;
        yield maybe(atLeast1(whitespaceOrNewLine));
    }
    const gotTest = yield maybe(str("WHEN"));
    if (gotTest) {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("=");
        yield maybe(atLeast1(whitespaceOrNewLine));
        test = yield predicateTQueryExpression;
        yield maybe(atLeast1(whitespaceOrNewLine));
    }

    yield maybe(str(";"));
    yield returnPred({
        kind: "TDebugger",
        label: label,
        test: test
    } as TDebugger);
}