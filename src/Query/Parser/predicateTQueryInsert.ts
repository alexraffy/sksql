import {predicateTTableName} from "./predicateTTableName";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {exitIf} from "../../BaseParser/Predicates/exitIf";
import {predicateTQueryExpression} from "./predicateTQueryExpression";
import {predicateTQueryFunctionCall} from "./predicateTQueryFunctionCall";
import {predicateTVariable} from "./predicateTVariable";
import {predicateTBoolValue} from "./predicateTBoolValue";
import {predicateTColumn} from "./predicateTColumn";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {literal} from "../../BaseParser/Predicates/literal";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTQuerySelect} from "./predicateTQuerySelect";
import {predicateTString} from "./predicateTString";
import {predicateTNumber} from "./predicateTNumber";
import {predicateTLiteral} from "./predicateTLiteral";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TLiteral} from "../Types/TLiteral";
import {TQueryExpression} from "../Types/TQueryExpression";
import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";
import {TVariable} from "../Types/TVariable";
import {TBoolValue} from "../Types/TBoolValue";
import {TColumn} from "../Types/TColumn";
import {TString} from "../Types/TString";
import {TNumber} from "../Types/TNumber";
import {TQuerySelect} from "../Types/TQuerySelect";
import {TQueryInsert} from "../Types/TQueryInsert";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";
import {TNull} from "../Types/TNull";
import {predicateTNull} from "./predicateTNull";

/*
    tries to parse an insert statement
    INSERT INTO {TABLENAME} [(COLUMNS,...)] VALUES(...)
    INSERT INTO {TABLENAME} [(COLUMNS,...)] SELECT ...
 */
export const predicateTQueryInsert = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    yield str("INSERT");
    yield atLeast1(whitespaceOrNewLine);
    yield str("INTO");
    yield atLeast1(whitespaceOrNewLine);
    const tableName = yield predicateTTableName;
    yield maybe(atLeast1(whitespaceOrNewLine));
    let hasColumns = yield maybe(str("("));
    let gotMore = ",";

    let columns: TLiteral[] = [];
    let values: (TQueryExpression | TQueryFunctionCall | TNull | TVariable | TBoolValue | TColumn | TString | TLiteral | TNumber)[] = [];
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
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("(");
        gotMore = ",";
        while (gotMore === ",") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            let value = yield oneOf([predicateTQueryExpression, predicateTQueryFunctionCall, predicateTNull, predicateTVariable, predicateTBoolValue, predicateTColumn, predicateTString, predicateTLiteral, predicateTNumber], "");
            values.push(value);
            yield maybe(atLeast1(whitespaceOrNewLine));
            gotMore = yield maybe(str(","));
        }
        yield str(")");
    } else {
        selectStatement = yield predicateTQuerySelect;
    }
    yield maybe(str(";"));
    yield returnPred({
        kind: "TQueryInsert",
        table: tableName,
        columns: columns,
        hasValues: valuesOrSelect,
        values: values,
        selectStatement: selectStatement
    } as TQueryInsert)


}