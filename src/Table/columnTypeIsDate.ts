import {TableColumnType} from "./TableColumnType";


export function columnTypeIsDate(t: TableColumnType) {
    return t === TableColumnType.date;
}