import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {str} from "../../BaseParser/Predicates/str";
import {predicateTNumber} from "./predicateTNumber";
import {TNumber} from "../Types/TNumber";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {whitespace} from "../../BaseParser/Predicates/whitespace";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {either} from "../../BaseParser/Predicates/either";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {whitespaceOrNewLine} from "../../BaseParser/Predicates/whitespaceOrNewLine";

/*
    tries to parse the column type and if it is nullable in a CREATE TABLE statement
 */
export const predicateTColumnType = function *(callback) {
    if (callback === "isGenerator") {
        return;
    }
    let size: TNumber = {kind: "TNumber", value: "1" }
    let dec: TNumber = {kind: "TNumber", value: "0"}
    const type = yield oneOf([str("int8"), str("int16"), str("int32"), str("int64"),
        str("uint8"), str("uint16"), str("uint32"), str("uint64"), str("integer"), str("int"),
        str("BOOLEAN"), str("VARCHAR"),
        str("NUMERIC")
        ], "a column type");
    if (type.toUpperCase() === "NUMERIC") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("(");
        yield maybe(atLeast1(whitespaceOrNewLine));
        size = yield predicateTNumber;
        yield maybe(atLeast1(whitespaceOrNewLine));
        let hasDecimal = yield maybe(str(","));
        if (hasDecimal === ",") {
            yield maybe(atLeast1(whitespaceOrNewLine));
            dec = yield predicateTNumber;
            yield maybe(atLeast1(whitespaceOrNewLine));
        }
        yield str(")")
    }
    if (type.toUpperCase() === "VARCHAR") {
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str("(");
        yield maybe(atLeast1(whitespaceOrNewLine));
        size = yield predicateTNumber
        yield maybe(atLeast1(whitespaceOrNewLine));
        yield str(")");
    }
    yield maybe(atLeast1(whitespaceOrNewLine));
    const nullable = yield maybe(oneOf([str("NOT NULL"), str("NULL")], ""));

    yield returnPred({
        kind: "TColumnType",
        type: type,
        size: size,
        dec: (type.toUpperCase() === "NUMERIC") ? dec : undefined,
        isNullable: {kind: "TBoolValue", value: (nullable === undefined) ? true : ((nullable === "NULL") ? true : false)}
    });
}