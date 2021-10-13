import {TableColumnType} from "./TableColumnType";

/*
    Information about a column

 */
export interface TableColumn {
    name: string;
    type: TableColumnType,
    length: number,
    decimal?: number,
    nullable: boolean;
    defaultExpression: string;
    offset?: number
}