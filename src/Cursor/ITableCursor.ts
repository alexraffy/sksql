

// struct for a cursor
// rowLength is the sum of the size of all columns in the table, this does not contain the row header.
// blockIndex and offset is used to position the cursor on the row

export interface ITableCursor {
    tableIndex: number;
    blockIndex: number;
    rowLength: number;
    offset: number;
}