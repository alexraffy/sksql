import {ITableCursor} from "./ITableCursor";

// check if the cursor has more rows to read

export function cursorEOF(cursor: ITableCursor) {
    return cursor.offset === -1;
}