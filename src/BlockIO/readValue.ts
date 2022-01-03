import {ITableDefinition} from "../Table/ITableDefinition";
import {TableColumn} from "../Table/TableColumn";
import {ITable} from "../Table/ITable";
import {TableColumnType} from "../Table/TableColumnType";
import {readStringFromUtf8Array} from "./readStringFromUtf8Array";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TDateTime} from "../Query/Types/TDateTime";

/*
    read a column value from the row DataView
    offset should be set to 5 if the row DataView contains the 5 bytes row header
 */
export function readValue(table: ITable, tableDef: ITableDefinition,
                          column: TableColumn, fullRow: DataView, offset: number = 5):
    string | number | boolean | bigint | numeric | TDate | TTime | TDateTime {
    let value: number | string | boolean | bigint | numeric | TDate | TTime | TDateTime;
    let isNull = fullRow.getUint8(column.offset + offset);
    if (isNull === 1) {
        return undefined;
    }

    switch (column.type) {
        case TableColumnType.int8:
            value = fullRow.getInt8(column.offset + offset + 1);
            break;
        case TableColumnType.int16:
            value = fullRow.getInt16(column.offset + offset + 1);
            break;
        case TableColumnType.int32:
            value = fullRow.getInt32(column.offset + offset + 1);
            break;
        case TableColumnType.int64:
            value = fullRow.getBigInt64(column.offset + offset + 1);
            break;
        case TableColumnType.uint8:
            value = fullRow.getUint8(column.offset + offset + 1);
            break;
        case TableColumnType.uint16:
            value = fullRow.getUint16(column.offset + offset + 1);
            break;
        case TableColumnType.uint32:
            value = fullRow.getUint32(column.offset + offset + 1);
            break;
        case TableColumnType.uint64:
            value = fullRow.getBigUint64(column.offset + offset + 1);
            break;
        case TableColumnType.int:
        {
            if (column.length === 1) {
                value = fullRow.getInt8(column.offset + offset + 1)
            } else if (column.length === 2) {
                value = fullRow.getInt16(column.offset + offset + 1);
            } else if (column.length === 4) {
                value = fullRow.getInt32(column.offset + offset + 1);
            }
        }
            break;
        case TableColumnType.varchar:
        {
            value = readStringFromUtf8Array(fullRow, column.offset + offset + 1, column.length);
        }
            break;
        case TableColumnType.boolean:
        {
            value = (fullRow.getUint8(column.offset + offset + 1) === 1) ? true : false;
        }
            break;
        case TableColumnType.numeric:
        {
            value = {
                sign: 0,
                m: 0,
                e: 0,
                approx: 0
            } as numeric;
            value.sign = fullRow.getUint8(column.offset + offset + 1);
            value.m = fullRow.getUint32(column.offset + offset + 2);
            value.e = fullRow.getUint16(column.offset + offset + 2 + 4);
            value.approx = 0;
        }
        break;
        case TableColumnType.date:
        {
            value = {
                kind: "TDate",
                year: 0,
                month: 0,
                day: 0
            } as TDate;
            let dateFlag = fullRow.getUint8(column.offset + offset + 1)
            value.year = fullRow.getUint32(column.offset + offset + 2);
            value.month = fullRow.getUint8(column.offset + offset + 2 + 4);
            value.day = fullRow.getUint8(column.offset + offset + 2 + 4 + 1);
        }
        break;
        case TableColumnType.time:
        {
            value = {
                kind: "TTime",
                hours: 0,
                minutes: 0,
                seconds: 0,
                millis: 0
            } as TTime;
            value.hours = fullRow.getUint8(column.offset + offset + 1);
            value.minutes = fullRow.getUint8(column.offset + offset + 2);
            value.seconds = fullRow.getUint8(column.offset + offset + 3);
            value.millis = fullRow.getUint16(column.offset + offset + 4);

        }
        break;
        case TableColumnType.datetime:
        {
            value = {
                kind: "TDateTime",
                date: {
                    kind: "TDate",
                    year: 0,
                    month: 0,
                    day: 0
                } as TDate,
                time: {
                    kind: "TTime",
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    millis: 0
                } as TTime
            } as TDateTime;
            let dateFlag = fullRow.getUint8(column.offset + offset + 1)
            value.date.year = fullRow.getUint32(column.offset + offset + 2);
            value.date.month = fullRow.getUint8(column.offset + offset + 2 + 4);
            value.date.day = fullRow.getUint8(column.offset + offset + 2 + 4 + 1);
            value.time.hours = fullRow.getUint8(column.offset + offset + 2 + 4 + 1 + 1);
            value.time.minutes = fullRow.getUint8(column.offset + offset + 2 + 4 + 1 + 2);
            value.time.seconds = fullRow.getUint8(column.offset + offset + 2 + 4 + 1 + 3);
            value.time.millis = fullRow.getUint16(column.offset + offset + 2 + 4 + 1 + 4);

        }
        break;
    }

    return value;

}