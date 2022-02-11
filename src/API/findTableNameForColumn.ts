import {TTableWalkInfo} from "./TTableWalkInfo";
import {TValidStatementsInProcedure} from "../Query/Types/TValidStatementsInProcedure";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";
import {TQueryDelete} from "../Query/Types/TQueryDelete";


function walkTableColumns(t: TTableWalkInfo, columnName: string) {
    let ret = [];
    if (t !== undefined) {
        for (let x = 0; x < t.def.columns.length; x++) {
            if (t.def.columns[x].name.toUpperCase() === columnName.toUpperCase()) {
                ret.push(t.name);
            }
        }
    }
    return ret;
}


export function findTableNameForColumn(columnName: string,
                                       tables: TTableWalkInfo[],
                                       currentStatement: TValidStatementsInProcedure,
                                       forceTable: string = undefined): string[] {
    let ret: string[] = [];
    if (forceTable !== undefined) {
        return [forceTable];
    }
    if (currentStatement !== undefined) {
        if (instanceOfTQuerySelect(currentStatement)) {
            let st = currentStatement as TQuerySelect;
            for (let i = 0; i < st.tables.length; i++) {
                let t = tables.find((t) => { return t.name.toUpperCase() === getValueForAliasTableOrLiteral(st.tables[i].tableName).table.toUpperCase();});
                if (t !== undefined) {
                    ret.push(...walkTableColumns(t, columnName));
                }
            }
        }
        if (instanceOfTQueryUpdate(currentStatement)) {
            let st = currentStatement as TQueryUpdate;
            if (st.table !== undefined) {
                let t = tables.find((t) => { return t.name.toUpperCase() === getValueForAliasTableOrLiteral(st.table).table.toUpperCase();});
                if (t !== undefined) {
                    ret.push(...walkTableColumns(t, columnName));
                }
            }
            if (st.tables !== undefined) {
                for (let i = 0; i < st.tables.length; i++) {
                    let t = tables.find((t) => { return t.name.toUpperCase() === getValueForAliasTableOrLiteral(st.tables[i].tableName).table.toUpperCase();});
                    if (t !== undefined) {
                        ret.push(...walkTableColumns(t, columnName));
                    }
                }
            }
        }
        if (instanceOfTQueryDelete(currentStatement)) {
            let st = currentStatement as TQueryDelete;
            if (st.tables !== undefined) {
                for (let i = 0; i < st.tables.length; i++) {
                    let t = tables.find((t) => { return t.name.toUpperCase() === getValueForAliasTableOrLiteral(st.tables[i].tableName).table.toUpperCase();});
                    if (t !== undefined) {
                        ret.push(...walkTableColumns(t, columnName));
                    }
                }
            }
        }
    }
    if (ret.length > 0) {
        return ret;
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