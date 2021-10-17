import {ITableDefinition} from "../Table/ITableDefinition";
import {TableColumn} from "../Table/TableColumn";
import {ITable} from "../Table/ITable";
import {TableColumnType} from "../Table/TableColumnType";
import {readStringFromUtf8Array} from "./readStringFromUtf8Array";
import {numeric} from "../Numeric/numeric";
import {TDate} from "../Query/Types/TDate";

/*
    read a column value from the row DataView
    offset should be set to 5 if the row DataView contains the 5 bytes row header
 */
export function readValue(table: ITable, tableDef: ITableDefinition, column: TableColumn, fullRow: DataView, offset: number = 5): string | number | boolean | bigint | numeric | TDate {
    let value: number | string | boolean | bigint | numeric | TDate;
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
    }

    return value;

}