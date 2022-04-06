import {predicateTTableName} from "./predicateTTableName";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {str} from "../../BaseParser/Predicates/str";
import {TStar} from "../Types/TStar";

// parse * or table.*

export function *predicateTStar(callback) {
    const table = yield maybe(predicateTTableName);
    if (table) {
        yield str(".");
    }
    yield str("*");
    yield returnPred({
        kind: "TStar",
        table: table
    } as TStar)
}