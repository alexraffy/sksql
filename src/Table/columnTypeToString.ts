import {TableColumnType} from "./TableColumnType";


export function columnTypeToString(type: TableColumnType) {
    switch (type) {
        case TableColumnType.any:
            return "ANY";
        case TableColumnType.blob:
            return "BLOB";
        case TableColumnType.boolean:
            return "BOOLEAN";
        case TableColumnType.date:
            return "DATE";
        case TableColumnType.datetime:
            return "DATETIME";
        case TableColumnType.float:
            return "FLOAT";
        case TableColumnType.int:
            return "INT";
        case TableColumnType.int8:
            return "INT8";
        case TableColumnType.int16:
            return "INT16";
        case TableColumnType.int32:
            return "INT32";
        case TableColumnType.int64:
            return "INT64";
        case TableColumnType.numeric:
            return "NUMERIC";
        case TableColumnType.time:
            return "TIME";
        case TableColumnType.uint8:
            return "UINT8";
        case TableColumnType.uint16:
            return "UINT16";
        case TableColumnType.uint32:
            return "UINT32";
        case TableColumnType.uint64:
            return "UINT64";
        case TableColumnType.varchar:
            return "VARCHAR";
        default:
            return "UNKNOWN TYPE " + type;
    }
}