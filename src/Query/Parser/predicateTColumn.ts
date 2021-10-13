import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {literal} from "../../BaseParser/Predicates/literal";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TColumn} from "../Types/TColumn";

/*
    tries to parse a column literal
    valid matches:  COLUMN
                    [COLUMN]
                    TABLE.COLUMN
                    [TABLE].[COLUMN]
 */
export const predicateTColumn = function *(callback) {
    // @ts-ignore
    if (callback === "isGenerator") {
        return;
    }
    yield maybe(str("["));
    const a = yield literal;
    yield maybe(str("]"));
    yield maybe(str("."));
    yield maybe(str("["));
    const b = yield maybe(literal);
    yield maybe(str("]"));
    let columnName = (b === undefined) ? a : b;
    let tableName = (b === undefined) ? "" : a;
    return returnPred({
        kind: "TColumn",
        column: columnName,
        table: tableName
    } as TColumn)

}

