

/*
    .tableDef contains the table header buffer, read it with readTableDefinition
    .blocks contains an array of buffer blocks
 */
export interface ITableData {
    tableDef: SharedArrayBuffer;
    blocks: SharedArrayBuffer[];
}
