import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";
import {convertToType} from "../Table/convertToType";
import {TableColumnType} from "../Table/TableColumnType";
import {isNumeric} from "../Numeric/isNumeric";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {TBooleanResult} from "./TBooleanResult";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";
import {kBooleanResult} from "./kBooleanResult";


export function convertValue(value: string | number | numeric | boolean | TDate | TDateTime | TTime | bigint | TBooleanResult,
                             type: TableColumnType ): string | number | numeric | boolean | TDate | TDateTime | TTime | bigint {
    let val2Write: string | number | numeric | boolean | TDate | TDateTime | TTime | bigint = undefined;
    if (value === undefined || type === undefined) {
        return value as any;
    }
    if (type === TableColumnType.any) {
        if (instanceOfTBooleanResult(value)) {
            return value.value === kBooleanResult.isTrue;
        }
        return value;
    }
    if (typeof value === "string") {
        val2Write = convertToType(value, TableColumnType.varchar, type);
    } else if (typeof value === "number") {
        if (Number.isInteger(value)) {
            val2Write = convertToType(value, TableColumnType.int32, type);
        } else {
            val2Write = convertToType(value, TableColumnType.float, type);
        }
    } else if (typeof value === "boolean") {
        val2Write = convertToType(value, TableColumnType.boolean, type);
    } else if (typeof value === "bigint") {
        val2Write = convertToType(value, TableColumnType.int64, type);
    } else if (isNumeric(value)) {
        val2Write = convertToType(value, TableColumnType.numeric, type);
    } else if (instanceOfTDateTime(value)) {
        val2Write = convertToType(value, TableColumnType.datetime, type);
    } else if (instanceOfTTime(value)) {
        val2Write = convertToType(value, TableColumnType.time, type);
    } else if (instanceOfTDate(value)) {
        val2Write = convertToType(value, TableColumnType.date, type);
    } else if (instanceOfTBooleanResult(value)) {
        val2Write = value.value === kBooleanResult.isTrue;
    } else {
        throw "convertValue does not implement the right converter for value " + value + " to TableColumnType " + type;
    }
    return val2Write;
}