import {TableColumnType} from "./TableColumnType";


export function tableColumnType2String(col: TableColumnType, length: number, decimal: number) {
    switch (col) {
        case TableColumnType.int8:
            return "INT8";
        case TableColumnType.int16:
            return "INT16";
        case TableColumnType.int32:
            return "INT32";
        case TableColumnType.int64:
            return "INT64";
        case TableColumnType.uint8:
            return "UINT8";
        case TableColumnType.uint16:
            return "UINT16";
        case TableColumnType.uint32:
            return "UINT32";
        case TableColumnType.uint64:
            return "UINT64";
        case TableColumnType.int:
            return "INT32";
        case TableColumnType.double:
        case TableColumnType.float:
            return "REAL";
        case TableColumnType.date:
            return "DATE";
        case TableColumnType.datetime:
            return "DATETIME";
        case TableColumnType.time:
            return "TIME";
        case TableColumnType.boolean:
            return "BOOLEAN";
        case TableColumnType.blob:
            return "BLOB";
        case TableColumnType.numeric:
            return "NUMERIC(" + length + ", " + decimal + ")";
        case TableColumnType.varchar:
            return "VARCHAR(" + length + ")";
    }
    return "";
}
