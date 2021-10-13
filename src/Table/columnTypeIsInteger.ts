import {TableColumnType} from "./TableColumnType";


export function columnTypeIsInteger(t: TableColumnType): boolean {
    switch (t) {
        case TableColumnType.int:
        case TableColumnType.uint8:
        case TableColumnType.uint16:
        case TableColumnType.uint32:
        case TableColumnType.uint64:
        case TableColumnType.int8:
        case TableColumnType.int16:
        case TableColumnType.int32:
        case TableColumnType.int64:
            return true;
        break;
    }
    return false;
}