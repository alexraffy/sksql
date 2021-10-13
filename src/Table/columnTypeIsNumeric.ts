import {TableColumn} from "./TableColumn";
import {TableColumnType} from "./TableColumnType";


export const columnTypeIsNumeric = (t: TableColumnType) => {
    return t === TableColumnType.numeric;
}