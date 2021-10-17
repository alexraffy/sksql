import {TableColumn} from "./TableColumn";
import {TableColumnType} from "./TableColumnType";


export function sizeRequiredForColumn(column: TableColumn) {
    let valueSize = 0;
    switch (column.type) {
        case TableColumnType.int:
            valueSize += 4;
            break;
        case TableColumnType.int8:
        case TableColumnType.uint8:
            valueSize += 1;
            break;
        case TableColumnType.int16:
        case TableColumnType.uint16:
            valueSize += 2;
            break;
        case TableColumnType.int32:
        case TableColumnType.uint32:
            valueSize += 4;
            break;
        case TableColumnType.int64:
        case TableColumnType.uint64:
            valueSize += 8;
            break;
        case TableColumnType.boolean:
            valueSize += 1;
            break;
        case TableColumnType.varchar:
            valueSize += 1 * column.length;
            break;
        case TableColumnType.numeric:
            valueSize += 1  + 4 + 2;
            break;
        case TableColumnType.date:
            valueSize += 1 + 4 + 1 + 1;
            break;
        case TableColumnType.time:
            valueSize += 4

    }
    return valueSize;
}