import {TTableWalkInfo} from "./TTableWalkInfo";


export function findTableNameForColumn(columnName: string, tables: TTableWalkInfo[], forceTable: string = undefined): string[] {
    let ret: string[] = [];
    if (forceTable !== undefined) {
        return [forceTable];
    }
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].name.startsWith("#")) {
            continue;
        }
        for (let x = 0; x < tables[i].def.columns.length; x++) {
            if (tables[i].def.columns[x].name.toUpperCase() === columnName.toUpperCase()) {
                ret.push(tables[i].name);
            }
        }
    }
    return ret;
}