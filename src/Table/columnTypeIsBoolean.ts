import {TableColumnType} from "./TableColumnType";


export function columnTypeIsBoolean(t: TableColumnType) {
    return t === TableColumnType.boolean;
}