import {ITableCursor} from "./ITableCursor";


export function cursorEOF(cursor: ITableCursor) {
    return cursor.offset === -1;
}