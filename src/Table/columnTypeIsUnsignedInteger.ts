import {TableColumnType} from "./TableColumnType";


export function columnTypeIsUnsignedInteger(t: TableColumnType) {
    switch (t) {
        case TableColumnType.uint8:
        case TableColumnType.uint16:
        case TableColumnType.uint32:
        case TableColumnType.uint64:
            return true;
    }
    return false;
}