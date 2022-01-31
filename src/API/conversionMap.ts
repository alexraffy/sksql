import {TableColumnType} from "../Table/TableColumnType";
import {isNumeric} from "../Numeric/isNumeric";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {TParserError} from "./TParserError";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {numeric} from "../Numeric/numeric";
import {TDateTime} from "../Query/Types/TDateTime";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";


export function conversionMap(a: string | number | numeric | boolean | TDateTime | TDate | TTime | bigint,
                              b: string | number | numeric | boolean | TDateTime | TDate | TTime | bigint
                              ): TableColumnType {

    if (typeof a === "string") {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            return TableColumnType.varchar;
        }
        if (isNumeric(b)) {
            return TableColumnType.varchar;
        }
        if (typeof b === "boolean") {
            return TableColumnType.varchar;
        }
        if (instanceOfTDateTime(b)) {
            return TableColumnType.varchar;
        }
        if (instanceOfTDate(b)) {
            return TableColumnType.varchar;
        }
        if (instanceOfTTime(b)) {
            return TableColumnType.varchar;
        }
    }
    if (typeof a === "number") {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            return TableColumnType.int32;
        }
        if (isNumeric(b)) {
            if (b.e === 0) {
                return TableColumnType.int32;
            }
            return TableColumnType.numeric;
        }
        if (typeof b === "boolean") {
            throw new TParserError("Incompatible types between Int and Boolean");
        }
        if (instanceOfTDateTime(b)) {
            throw new TParserError("Incompatible types between Int and DateTime");
        }
        if (instanceOfTDate(b)) {
            throw new TParserError("Incompatible types between Int and Date");
        }
        if (instanceOfTTime(b)) {
            throw new TParserError("Incompatible types between Int and Time");
        }
    }
    if (isNumeric(a)) {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            if ((a as numeric).e === 0) {
                return TableColumnType.int32;
            }
            return TableColumnType.numeric;
        }
        if (isNumeric(b)) {
            return TableColumnType.numeric;
        }
        if (typeof b === "boolean") {
            throw new TParserError("Incompatible types between Numeric and Boolean");
        }
        if (instanceOfTDateTime(b)) {
            throw new TParserError("Incompatible types between Numeric and DateTime");
        }
        if (instanceOfTDate(b)) {
            throw new TParserError("Incompatible types between Numeric and Date");
        }
        if (instanceOfTTime(b)) {
            throw new TParserError("Incompatible types between Numeric and Time");
        }
    }
    if (typeof a === "boolean") {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            throw new TParserError("Incompatible types between Boolean and Int");
        }
        if (isNumeric(b)) {
            throw new TParserError("Incompatible types between Boolean and Numeric");
        }
        if (typeof b === "boolean") {
            return TableColumnType.boolean;
        }
        if (instanceOfTDateTime(b)) {
            throw new TParserError("Incompatible types between Boolean and DateTime");
        }
        if (instanceOfTDate(b)) {
            throw new TParserError("Incompatible types between Boolean and Date");
        }
        if (instanceOfTTime(b)) {
            throw new TParserError("Incompatible types between Boolean and Time");
        }
    }
    if (instanceOfTDateTime(a)) {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            throw new TParserError("Incompatible types between DateTime and Int");
        }
        if (isNumeric(b)) {
            throw new TParserError("Incompatible types between DateTime and Numeric");
        }
        if (typeof b === "boolean") {
            throw new TParserError("Incompatible types between DateTime and Boolean");
        }
        if (instanceOfTDateTime(b)) {
            return TableColumnType.datetime;
        }
        if (instanceOfTDate(b)) {
            return TableColumnType.date;
        }
        if (instanceOfTTime(b)) {
            return TableColumnType.time;
        }
    }
    if (instanceOfTDate(a)) {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            throw new TParserError("Incompatible types between Date and Int");
        }
        if (isNumeric(b)) {
            throw new TParserError("Incompatible types between Date and Numeric");
        }
        if (typeof b === "boolean") {
            throw new TParserError("Incompatible types between Date and Boolean");
        }
        if (instanceOfTDateTime(b)) {
            return TableColumnType.date;
        }
        if (instanceOfTDate(b)) {
            return TableColumnType.date;
        }
        if (instanceOfTTime(b)) {
            throw new TParserError("Incompatible types between Date and Time");
        }
    }
    if (instanceOfTTime(a)) {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            throw new TParserError("Incompatible types between Time and Int");
        }
        if (isNumeric(b)) {
            throw new TParserError("Incompatible types between Time and Numeric");
        }
        if (typeof b === "boolean") {
            throw new TParserError("Incompatible types between Time and Boolean");
        }
        if (instanceOfTDateTime(b)) {
            return TableColumnType.time;
        }
        if (instanceOfTDate(b)) {
            throw new TParserError("Incompatible types between Time and Date");
        }
        if (instanceOfTTime(b)) {
            return TableColumnType.time;
        }
    }
    if (typeof a === "bigint") {
        if (typeof b === "string") {
            return TableColumnType.varchar;
        }
        if (typeof b === "number") {
            return TableColumnType.int64;
        }
        if (isNumeric(b)) {
            return TableColumnType.int64;
        }
        if (typeof b === "boolean") {
            throw new TParserError("Incompatible types between BigInt and Boolean");
        }
        if (instanceOfTDateTime(b)) {
            throw new TParserError("Incompatible types between BigInt and DateTime");
        }
        if (instanceOfTDate(b)) {
            throw new TParserError("Incompatible types between BigInt and Date");
        }
        if (instanceOfTTime(b)) {
            throw new TParserError("Incompatible types between BigInt and Time");
        }
        if (typeof b === "bigint") {
            return TableColumnType.int64;
        }
    }
    throw new TParserError("Incompatible types between " + a + " and " + b);

}