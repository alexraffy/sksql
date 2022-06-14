import {ITableDefinition} from "./ITableDefinition";
import {TableColumn} from "./TableColumn";


export function getFirstPublicColumn(def: ITableDefinition): TableColumn {
    for (let i = 0; i < def.columns.length; i++) {
        if (def.columns[i].invisible !== true) {
            return def.columns[i];
        }
    }
    return undefined;
}