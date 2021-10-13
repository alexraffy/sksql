import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITableCursor} from "../Cursor/ITableCursor";


export interface TTableWalkInfo {
    name: string;
    alias: string;
    table: ITable;
    def: ITableDefinition;
    cursor: ITableCursor;
    rowLength: number;
}