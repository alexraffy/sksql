import {TableColumnType} from "../Table/TableColumnType";

// Convert a column type to an enum

export function typeString2TableColumnType(input: string): TableColumnType {
    let type: TableColumnType;
    switch (input) {
        case "UINT8":
            type = TableColumnType.uint8;
            break;
        case "UINT16":
            type = TableColumnType.uint16;
            break;
        case "UINT32":
            type = TableColumnType.uint32;
            break;
        case "UINT64":
            type = TableColumnType.uint64;
            break;
        case "INT8":
            type = TableColumnType.int8;
            break;
        case "INT16":
            type = TableColumnType.int16;
            break;
        case "INT32":
            type = TableColumnType.int32;
            break;
        case "INT64":
            type = TableColumnType.int64;
            break;
        case "INT":
        case "INTEGER":
            type = TableColumnType.int32;
            break;
        case "VARCHAR":
            type = TableColumnType.varchar;
            break;
        case "BOOLEAN":
            type = TableColumnType.boolean;
            break;
        case "NUMERIC":
        case "DECIMAL":
            type = TableColumnType.numeric;
            break;
        case "FLOAT":
        case "REAL":
        case "FLOAT32":
        case "REAL32":
            type = TableColumnType.float;
            break;
        case "DATE":
            type = TableColumnType.date;
            break;
        case "TIME":
            type = TableColumnType.time;
            break;
        case "DATETIME":
            type = TableColumnType.datetime;
            break;

    }
    return type;
}