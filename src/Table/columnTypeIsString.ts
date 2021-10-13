import {TableColumnType} from "./TableColumnType";


export function columnTypeIsString(t: TableColumnType) {
    return t === TableColumnType.varchar;
}