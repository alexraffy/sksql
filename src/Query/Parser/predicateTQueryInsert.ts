import {predicateTTableName} from "./predicateTTableName";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQuerySelect} from "./predicateTQuerySelect";
import {predicateTLiteral} from "./predicateTLiteral";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TLiteral} from "../Types/TLiteral";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TQuerySelect} from "../Types/TQuerySelect";
import {TQueryInsert} from "../Types/TQueryInsert";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {TValidExpressions} from "../Types/TValidExpressions";
import {predicateValidExpressions} from "./predicateValidExpressions";

/*
    tries to parse an insert statement
    INSERT INTO {TABLENAME} [(COLUMNS,...)] VALUES(...)
    INSERT INTO {TABLENAME} [(COLUMNS,...)] SELECT ...
 */
export const predicateTQueryInsert = function *(callback) {

    yield maybe(atLeast1(whitespaceOrNewLine));
    yield str("INSERT");
    yield atLeast1(whitespaceOrNewLine);
    yield str("INTO");
    yield atLeast1(whitespaceOrNewLine);
    const tableName = yield predicateTTableName;
    yield maybe(atLeast1(whitespaceOrNewLine));
    let hasColumns = yield maybe(str("("));
    let gotMore = ",";

    let columns: TLiteral[] = [];
    let values: {values: (TQueryExpression | TValidExpressions)[]}[] = [];
    let selectStatement: TQuerySelect = undefined;

    if (hasColumns === "(") {
        let numberOfParams = 0;

        while (gotMore === ",") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            let col = yield predicateTLiteral;
            columns.push(col);
            yield maybe(atLeast1(whitespaceOrNewLine));
            numberOfParams++;
            gotMore = yield maybe(str(","));
        }
        yield str(")");
        yield maybe(atLeast1(whitespaceOrNewLine));
    } else {

    }
    const valuesOrSelect = yield exitIf(str("VALUES"));

    if (valuesOrSelect === true) {
        yield str("VALUES");

        let gotMultipleInsert = ",";
        while (gotMultipleInsert === ",") {
            let vals = {values: []};
            yield maybe(atLeast1(whitespaceOrNewLine));
            yield str("(");
            gotMore = ",";
            while (gotMore === ",") {
                yield maybe(atLeast1(whitespaceOrNewLine));
                let value = yield oneOf([predicateTQueryExpression, predicateValidExpressions], "");
                vals.values.push(value);
                yield maybe(atLeast1(whitespaceOrNewLine));
                gotMore = yield maybe(str(","));
            }
            yield str(")");
            values.push(vals);
            yield maybe(atLeast1(whitespaceOrNewLine));
            gotMultipleInsert = yield maybe(str(","))
        }

    } else {
        selectStatement = yield predicateTQuerySelect;
    }
    yield maybe(str(";"));
    yield maybe(atLeast1(whitespaceOrNewLine));

    yield returnPred({
        kind: "TQueryInsert",
        table: tableName,
        columns: columns,
        hasValues: valuesOrSelect,
        values: values,
        selectStatement: selectStatement
    } as TQueryInsert)


}