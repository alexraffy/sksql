import {TableColumnType} from "../Table/TableColumnType";


// elect a column type for a result column from a list of column types in an expression

// ex: 1 + 1.0 will return a NUMERIC
// ex: FLOAT_COLUMN + 1 will return a FLOAT
// ex: INT32_COLUMN + UINT8_COLUMN will return a INT32

export function electQueryColumnType(expressionTypes: TableColumnType[]) {
    if (expressionTypes.length === 0) {
        return TableColumnType.int;
    }
    let intSize = 1;
    let isSigned = false;
    for (let i = 0; i < expressionTypes.length; i++) {
        let t = expressionTypes[i];
        switch (t) {
            case TableColumnType.date:
                return TableColumnType.date;
            case TableColumnType.time:
                return TableColumnType.time;
            case TableColumnType.datetime:
                return TableColumnType.datetime;
            case TableColumnType.numeric:
                return TableColumnType.numeric;
            case TableColumnType.boolean:
                return TableColumnType.boolean;
            case TableColumnType.varchar:
                return TableColumnType.varchar;
            case TableColumnType.float:
                return TableColumnType.float;
            case TableColumnType.double:
                return TableColumnType.double;
            case TableColumnType.int:
            case TableColumnType.int16:
            case TableColumnType.int32:
            case TableColumnType.int64:
                isSigned = true;
                break;
            default: {
                if (isSigned !== true) {
                    isSigned = false;
                }
            }
        }
        if ((t === TableColumnType.int64 || t === TableColumnType.uint64) && intSize < 8) {
            intSize = 8;
        }
        if ((t === TableColumnType.int || t === TableColumnType.int32 || TableColumnType.uint32) && intSize < 4) {
            intSize = 4;
        }
        if (t === TableColumnType.int16 && intSize < 2) {
            intSize = 2;
        }

    }

    if (isSigned) {
        switch (intSize) {
            case 1:
                return TableColumnType.int8;
            case 2:
                return TableColumnType.int16;
            case 4:
                return TableColumnType.int32;
            case 8:
                return TableColumnType.int64;
        }
    } else {
        switch (intSize) {
            case 1:
                return TableColumnType.uint8;
            case 2:
                return TableColumnType.uint16;
            case 4:
                return TableColumnType.uint32;
            case 8:
                return TableColumnType.uint64;
        }
    }
    return TableColumnType.int32;

}