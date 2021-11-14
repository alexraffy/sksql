import {TableColumnType} from "./TableColumnType";


export function columnTypeIsSignedInteger(t: TableColumnType) {
    switch (t) {
        case TableColumnType.int:
        case TableColumnType.int8:
        case TableColumnType.int16:
        case TableColumnType.int32:
        case TableColumnType.int64:
            return true;
    }
    return false;
}