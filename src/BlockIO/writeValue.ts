import {ITableDefinition} from "../Table/ITableDefinition";
import {TableColumn} from "../Table/TableColumn";
import {ITable} from "../Table/ITable";
import {TableColumnType} from "../Table/TableColumnType";
import {writeStringToUtf8ByteArray} from "./writeStringToUtf8ByteArray";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {parseDateString} from "../Date/parseDateString";
import {TTime} from "../Query/Types/TTime";
import {TDateTime} from "../Query/Types/TDateTime";
import {parseTimeString} from "../Date/parseTimeString";
import {parseDateTimeString} from "../Date/parseDateTimeString";
import {TParserError} from "../API/TParserError";

/*
    write a column value in the DataView fullrow
    offset is calculated from the offset value of the Column Definition in column
    extraOffset should be set to 5 if the row contains a header
 */
export function writeValue(table: ITable, tableDef: ITableDefinition,
                           column: TableColumn, fullRow: DataView,
                           value: string | number | boolean | bigint | numeric | TDate | TTime | TDateTime, extraOffset: number = 5) {
    fullRow.setUint8(column.offset + extraOffset, (value === undefined) ? 1 : 0);
    if (value === undefined) {
        switch (column.type) {
            case TableColumnType.uint8:
                fullRow.setUint8(column.offset + extraOffset + 1, 0);
                break;
            case TableColumnType.uint16:
                fullRow.setUint16(column.offset + extraOffset + 1, 0);
                break;
            case TableColumnType.uint32:
                fullRow.setUint32(column.offset + extraOffset + 1, 0);
                break;
            case TableColumnType.uint64:
                fullRow.setBigUint64(column.offset + extraOffset + 1, 0n);
                break;
            case TableColumnType.int8:
                fullRow.setInt8(column.offset + extraOffset + 1, 0);
                break;
            case TableColumnType.int16:
                fullRow.setInt16(column.offset + extraOffset + 1, 0);
                break;
            case TableColumnType.int32:
                fullRow.setInt32(column.offset + extraOffset + 1, 0);
                break;
            case TableColumnType.int64:
                fullRow.setBigInt64(column.offset + extraOffset + 1, 0n);
                break;
            case TableColumnType.int:
                if (column.length === 1) {
                    fullRow.setInt8(column.offset + extraOffset + 1, 0);
                } else if (column.length === 2) {
                    fullRow.setInt16(column.offset + extraOffset + 1, 0);
                } else if (column.length === 4) {
                    fullRow.setInt32(column.offset + extraOffset + 1, 0);
                } else if (column.length === 8) {
                    fullRow.setBigInt64(column.offset + extraOffset + 1, 0n);
                } else {
                    throw new TParserError("Int column must have a size of 1,2,4 or 8");
                }
                break;
            case TableColumnType.varchar:
                writeStringToUtf8ByteArray(fullRow, column.offset + extraOffset + 1, "", column.length);
                break;
            case TableColumnType.boolean:
                fullRow.setUint8(column.offset + extraOffset, 0);
                break;
            case TableColumnType.numeric:
                fullRow.setUint8(column.offset + extraOffset + 1, 0);
                fullRow.setBigUint64(column.offset + extraOffset + 2, 0n);
                fullRow.setInt16(column.offset + extraOffset + 2 + 8, 0);
                break;
            case TableColumnType.date:
                let flagUnknownYear = 1;
                let flagUnknownMonth = 1;
                let flagUnknownDay = 1;
                let flag = 0;
                flag |= flagUnknownYear << 7;
                flag |= flagUnknownMonth << 6;
                flag |= flagUnknownDay << 5;
                fullRow.setUint8(column.offset + extraOffset + 1, flag);
                fullRow.setUint32(column.offset + extraOffset + 2, 0);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4, 0);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1, 0);
                break;
            case TableColumnType.time:
            {
                fullRow.setUint8(column.offset + extraOffset + 1, 0);
                fullRow.setUint8(column.offset + extraOffset + 2, 0);
                fullRow.setUint8(column.offset + extraOffset + 3, 0);
                fullRow.setUint16(column.offset + extraOffset + 4, 0);
            }
            break;
            case TableColumnType.datetime:
            {
                let flagUnknownYear = 1;
                let flagUnknownMonth = 1;
                let flagUnknownDay = 1;
                let flag = 0;
                flag |= flagUnknownYear << 7;
                flag |= flagUnknownMonth << 6;
                flag |= flagUnknownDay << 5;
                fullRow.setUint8(column.offset + extraOffset + 1, flag);
                fullRow.setUint32(column.offset + extraOffset + 2, 0);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4, 0);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1, 0);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1 + 1, 0);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1 + 2, 0);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1 + 3, 0);
                fullRow.setUint16(column.offset + extraOffset + 2 + 4 + 1 + 4, 0);
            }
            break;
            case TableColumnType.float:
            {
                fullRow.setFloat32(column.offset + extraOffset + 1, 0);
            }
            break;
            case TableColumnType.double:
            {
                fullRow.setFloat64(column.offset + extraOffset + 1, 0);
            }
            break;
        }
    } else {
        switch (column.type) {
            case TableColumnType.uint8:
                fullRow.setUint8(column.offset + extraOffset + 1, value as number);
                break;
            case TableColumnType.uint16:
                fullRow.setUint16(column.offset + extraOffset + 1, value as number);
                break;
            case TableColumnType.uint32:
                fullRow.setUint32(column.offset + extraOffset + 1, value as number);
                break;
            case TableColumnType.uint64:
                fullRow.setBigUint64(column.offset + extraOffset + 1, value as bigint);
                break;
            case TableColumnType.int8:
                fullRow.setInt8(column.offset + extraOffset + 1, value as number);
                break;
            case TableColumnType.int16:
                fullRow.setInt16(column.offset + extraOffset + 1, value as number);
                break;
            case TableColumnType.int32:
                fullRow.setInt32(column.offset + extraOffset + 1, value as number);
                break;
            case TableColumnType.int64:
                fullRow.setBigInt64(column.offset + extraOffset + 1, value as bigint);
                break;
            case TableColumnType.int:
                if (column.length === 1) {
                    fullRow.setInt8(column.offset + extraOffset + 1, value as number);
                } else if (column.length === 2) {
                    fullRow.setInt16(column.offset + extraOffset + 1, value as number);
                } else if (column.length === 4) {
                    fullRow.setInt32(column.offset + extraOffset + 1, value as number);
                } else if (column.length === 8) {
                    fullRow.setBigInt64(column.offset + extraOffset + 1, value as bigint);
                } else {
                    throw new TParserError("Int column must have a size of 1,2,4 or 8");
                }
                break;
            case TableColumnType.varchar:
                writeStringToUtf8ByteArray(fullRow, column.offset + extraOffset + 1, value as string, column.length);
                break;
            case TableColumnType.boolean:
                fullRow.setUint8(column.offset + extraOffset + 1, (value === true) ? 1 : 0);
                break;
            case TableColumnType.numeric:
                let num = value as numeric;
                fullRow.setUint8(column.offset + extraOffset + 1, num.sign);
                fullRow.setBigUint64(column.offset + extraOffset + 2, BigInt.asUintN(64, BigInt(num.m)));
                fullRow.setInt16(column.offset + extraOffset + 2 + 8, num.e);
                break;
            case TableColumnType.date:
                let val = value as TDate;
                if (typeof value === "string") {
                    val = parseDateString(value);
                }
                let flagUnknownYear = (val.year === 0) ? 1 : 0;
                let flagUnknownMonth = (val.month === 0) ? 1 : 0;
                let flagUnknownDay = (val.day === 0) ? 1 : 0;
                let flag = 0;
                flag |= flagUnknownYear << 7;
                flag |= flagUnknownMonth << 6;
                flag |= flagUnknownDay << 5;
                fullRow.setUint8(column.offset + extraOffset + 1, flag);
                fullRow.setUint32(column.offset + extraOffset + 2, val.year);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4, val.month);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1, val.day);
                break;
            case TableColumnType.time:
            {
                let val = value as TTime;
                if (typeof value === "string") {
                    val = parseTimeString(value);
                }
                fullRow.setUint8(column.offset + extraOffset + 1, val.hours);
                fullRow.setUint8(column.offset + extraOffset + 2, val.minutes);
                fullRow.setUint8(column.offset + extraOffset + 3, val.seconds);
                fullRow.setUint16(column.offset + extraOffset + 4, val.millis);
            }
            break;
            case TableColumnType.datetime:
            {
                let val = value as TDateTime;
                if (typeof value === "string") {
                    val = parseDateTimeString(value);
                }
                let flagUnknownYear = (val.date.year === 0) ? 1 : 0;
                let flagUnknownMonth = (val.date.month === 0) ? 1 : 0;
                let flagUnknownDay = (val.date.day === 0) ? 1 : 0;
                let flag = 0;
                flag |= flagUnknownYear << 7;
                flag |= flagUnknownMonth << 6;
                flag |= flagUnknownDay << 5;
                fullRow.setUint8(column.offset + extraOffset + 1, flag);
                fullRow.setUint32(column.offset + extraOffset + 2, val.date.year);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4, val.date.month);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1, val.date.day);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1 + 1, val.time.hours);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1 + 2, val.time.minutes);
                fullRow.setUint8(column.offset + extraOffset + 2 + 4 + 1 + 3, val.time.seconds);
                fullRow.setUint16(column.offset + extraOffset + 2 + 4 + 1 + 4, val.time.millis);
            }
            break;
            case TableColumnType.float: {
                let val = value as number;
                fullRow.setFloat32(column.offset + extraOffset + 1, val);
            }
            break;
            case TableColumnType.double: {
                let val = value as number;
                fullRow.setFloat64(column.offset + extraOffset + 1, val);
            }
            break;
        }
    }

}