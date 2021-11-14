import {TableColumnType} from "./TableColumnType";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {numericDisplay} from "../Numeric/numericDisplay";
import {columnTypeToString} from "./columnTypeToString";
import {columnTypeIsInteger} from "./columnTypeIsInteger";
import {numericLoad} from "../Numeric/numericLoad";
import {parseDateString} from "../Date/parseDateString";
import {numericToNumber} from "../Numeric/numericToNumber";
import {columnTypeIsString} from "./columnTypeIsString";
import {columnTypeIsBoolean} from "./columnTypeIsBoolean";


export function convertToType(value: number | string | boolean | bigint | numeric | TDate, type: TableColumnType, dest: TableColumnType) {

    switch (dest) {
        case TableColumnType.varchar:
        {
            if (type === TableColumnType.varchar) {
                return value;
            }
            if (type === TableColumnType.date && instanceOfTDate(value)) {
                return `${value.year}-${value.month}-${value.day}`;
            }
            if (type === TableColumnType.numeric) {
                return numericDisplay(value as numeric);
            }
            if (type === TableColumnType.float) {
                return (value as number).toString();
            }
            if (type === TableColumnType.boolean) {
                return (value as boolean) === true ? "TRUE" : "FALSE";
            }
            if (columnTypeIsInteger(type)) {
                return (value as number).toString();
            }

        }
        break;
        case TableColumnType.boolean:
        {
            if (type === TableColumnType.varchar) {
                let upped = (value as string).toUpperCase();
                if (upped === "TRUE" || upped === "1") {
                    return true;
                }
                return false;
            }
        }
        break;
        case TableColumnType.numeric:
        {
            if (type === TableColumnType.varchar) {
                return numericLoad(value as string);
            }
            if (type === TableColumnType.float) {
                return numericLoad((value as number).toString());
            }
            if (columnTypeIsInteger(type)) {
                return numericLoad((value as number).toString());
            }
        }
        break;
        case TableColumnType.date:
        {
            if (type === TableColumnType.varchar) {
                return parseDateString(value as string);
            }
        }
        break;

    }

    if (columnTypeIsInteger(dest)) {
        if (columnTypeIsInteger(type)) {
            // loss of precision should have been checked with typeCanconvertTo
            return value as number;
        }
        if (type === TableColumnType.float) {
            return parseInt((value as number).toString());
        }
        if (type === TableColumnType.numeric) {
            return numericToNumber(value as numeric);
        }
        if (columnTypeIsString(type)) {
            return parseInt(value as string);
        }
        if (columnTypeIsBoolean(type)) {
            if ((value as boolean) === true) {
                return 1;
            }
            return 0;
        }
    }

    throw `Could not convert ${columnTypeToString(type)} to ${columnTypeToString(dest)}`;

}