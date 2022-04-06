import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {predicateTTableName} from "./predicateTTableName";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TQueryDropTable} from "../Types/TQueryDropTable";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {literal} from "../../BaseParser/Predicates/literal";
import {TQueryDropFunction} from "../Types/TQueryDropFunction";
import {TQueryDropProcedure} from "../Types/TQueryDropProcedure";

// parse DROP TABLE/FUNCTION/PROCEDURE


export function * predicateTQueryDrop(callback) {

    let ret: TQueryDropTable | TQueryDropFunction | TQueryDropProcedure;

    yield str("DROP");
    yield atLeast1(whitespaceOrNewLine);
    const what = yield literal;
    switch (what.toUpperCase()) {
        case "TABLE":
        {
            yield atLeast1(whitespaceOrNewLine);
            const table = yield predicateTTableName;
            ret = {
                kind: "TQueryDropTable",
                table: table
            };
        }
        break;
        case "FUNCTION":
        {
            yield atLeast1(whitespaceOrNewLine);
            const func = yield literal;
            ret = {
                kind: "TQueryDropFunction",
                funcName: func
            };
        }
        break;
        case "PROCEDURE":
        case "PROC":
        {
            yield atLeast1(whitespaceOrNewLine);
            const proc = yield literal;
            ret = {
                kind: "TQueryDropProcedure",
                procName: proc
            };
        }
        break;
    }

    yield maybe(atLeast1(whitespaceOrNewLine));
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred(ret);

}