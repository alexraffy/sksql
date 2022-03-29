import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {literal} from "../../BaseParser/Predicates/literal";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TTable} from "../Types/TTable";

/*
    tries to parse a table name
    [\[SCHEMA\].]\[TABLENAME\]
 */
export const predicateTTableName = function *(callback) {

    yield maybe(str("["));
    const a = yield literal;
    yield maybe(str("]"));
    yield maybe(str("."));
    yield maybe(str("["));
    const b = yield maybe(literal);
    yield maybe(str("]"));
    let table = (b === undefined) ? a : b;
    let schema = (b === undefined) ? "dbo" : a;
    return returnPred({
        kind: "TTable",
        table: table,
        schema: schema
    } as TTable)

}