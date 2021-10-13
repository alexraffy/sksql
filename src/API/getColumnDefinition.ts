import {TColumn} from "../Query/Types/TColumn";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {TColumnDefinition} from "../Query/Types/TColumnDefinition";
import {findTableNameForColumn} from "./findTableNameForColumn";
import {TableColumn} from "../Table/TableColumn";


export function getColumnDefinition(column: TColumn, tables: TTableWalkInfo[]): TableColumn {
    let table = column.table;
    if (table === "") {
        let tablesFound = findTableNameForColumn(column.column, tables);
        if (tablesFound.length === 0) {
            throw "Unknown column " + column.column;
        }
        if (tablesFound.length > 1) {
            throw "Ambiguous column name " + column.column;
        }
        table = tablesFound[0];
    }
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].name === table) {
            for (let x = 0; x < tables[i].def.columns.length; x++) {
                if (tables[i].def.columns[x].name.toUpperCase() === column.column.toUpperCase()) {
                    return tables[i].def.columns[x];
                }
            }
        }
    }
    return undefined;
}