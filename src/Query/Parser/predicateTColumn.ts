import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {literal} from "../../BaseParser/Predicates/literal";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TColumn} from "../Types/TColumn";
import {TParserError} from "../../API/TParserError";

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

    const keyWords = [
        "CREATE", "ALTER", "ASC", "DESC", "FROM", "ORDER", "BY", "WHERE", "HAVING", "SELECT", "UPDATE", "DELETE", "DROP", "TRUNCATE",
        "INSERT", "RETURN", "BREAK", "IF", "WHILE", "DEBUGGER", "SET", "GROUP", "EXECUTE", "EXEC", "CONTINUE", "BEGIN",
        "END", "AS"
    ];
    if (keyWords.includes(columnName.toUpperCase())) {
        throw new TParserError(columnName  + " is a reserved keyword.");
    }

    return returnPred({
        kind: "TColumn",
        column: columnName,
        table: tableName
    } as TColumn)

}

