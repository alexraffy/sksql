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
import {parseTimeString} from "../Date/parseTimeString";
import {parseDateTimeString} from "../Date/parseDateTimeString";
import {TTime} from "../Query/Types/TTime";
import {TDateTime} from "../Query/Types/TDateTime";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {isNumeric} from "../Numeric/isNumeric";
import {numericRound} from "../Numeric/numericRound";
import {TParserError} from "../API/TParserError";


export function convertToType(value: number | string | boolean | bigint | numeric | TDate | TTime | TDateTime, type: TableColumnType, dest: TableColumnType) {
    if (type === dest) {
        return value;
    }
    if (dest === TableColumnType.any) {
        return value;
    }

    switch (dest) {
        case TableColumnType.varchar:
        {
            if (type === TableColumnType.varchar) {
                return value;
            }
            if (type === TableColumnType.date && instanceOfTDate(value)) {
                return `${value.year}-${value.month}-${value.day}`;
            }
            if (type === TableColumnType.time && instanceOfTTime(value)) {
                let ret = `${value.hours}:${value.minutes}`;
                if (value.seconds !== undefined) {
                    ret += `:${value.seconds}`;
                    if (value.millis !== undefined) {
                        ret += `.${value.millis}`;
                    }
                }
                return ret;
            }
            if (type === TableColumnType.datetime && instanceOfTDateTime(value)) {
                let ret = `${value.date.year}-${value.date.month}-${value.date.day}T`;
                ret += `${value.time.hours}:${value.time.minutes}`;
                if (value.time.seconds !== undefined) {
                    ret += `:${value.time.seconds}`;
                } else {
                    ret += ':0';
                }
                if (value.time.millis !== undefined) {
                    ret += `.${value.time.millis}`;
                } else {
                    ret += ".000";
                }

                return ret;
            }
            if (type === TableColumnType.numeric) {
                return numericDisplay(value as numeric);
            }
            
            if (type === TableColumnType.boolean) {
                return (value as boolean) === true ? "TRUE" : "FALSE";
            }

            if (columnTypeIsInteger(type) || type === TableColumnType.float || type === TableColumnType.double) {
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
            if (type === TableColumnType.float || type === TableColumnType.double) {
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
            if (type === TableColumnType.datetime) {
                return (value as TDateTime).date;
            }
        }
        break;
        case TableColumnType.time:
        {
            if (type === TableColumnType.varchar) {
                return parseTimeString(value as string);
            }
        }
        break;
        case TableColumnType.datetime:
        {
            if (type === TableColumnType.varchar) {
                return parseDateTimeString(value as string);
            }
        }
            break;
        case TableColumnType.float:
        {
            if (type === TableColumnType.varchar) {
                return parseFloat(value as string);
            }
            if (columnTypeIsInteger(type)) {
                return 0.0 + (value as number);
            }
            if (type === TableColumnType.numeric || isNumeric(value)) {
                return parseFloat(numericDisplay(value as numeric));
            }
        }
        break;
        case TableColumnType.double:
        {
            if (type === TableColumnType.varchar) {
                return parseFloat(value as string);
            }
            if (columnTypeIsInteger(type)) {
                return 0.0 + (value as number);
            }
            if (type === TableColumnType.numeric || isNumeric(value)) {
                return parseFloat(numericDisplay(value as numeric));
            }
        }
        break;

    }

    if (columnTypeIsInteger(dest)) {
        if (columnTypeIsInteger(type)) {
            // loss of precision should have been checked with typeCanconvertTo
            return parseInt((value as number).toString());
        }
        if (type === TableColumnType.float) {
            return parseInt((value as number).toString());
        }
        if (type === TableColumnType.numeric) {
            return numericToNumber(numericRound(value as numeric, 0));
        }
        if (columnTypeIsString(type)) {
            ; //return parseInt(value as string);
        }
        if (columnTypeIsBoolean(type)) {
            if ((value as boolean) === true) {
                return 1;
            }
            return 0;
        }
    }

    throw new TParserError(`Could not convert ${columnTypeToString(type)} to ${columnTypeToString(dest)}`);

}