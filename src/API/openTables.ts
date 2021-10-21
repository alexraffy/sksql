import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TLiteral} from "../Query/Types/TLiteral";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {TTable} from "../Query/Types/TTable";
import {DBData} from "./DBInit";
import {readTableDefinition} from "../Table/readTableDefinition";
import {readFirst} from "../Cursor/readFirst";
import {recordSize} from "../Table/recordSize";
import {kQueryJoin} from "../Query/Enums/kQueryJoin";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TQueryInsert} from "../Query/Types/TQueryInsert";
import {TQueryDelete} from "../Query/Types/TQueryDelete";
import {TTableWalkInfo} from "./TTableWalkInfo";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {TAlias} from "../Query/Types/TAlias";


export function openTables(statement: TQuerySelect | TQueryUpdate | TQueryDelete): TTableWalkInfo[] {
    let ret : TTableWalkInfo[] = [];

    for (let i = 0; i < statement.tables.length; i++) {
        let tableToOpen = "";
        let alias = "";
        if (instanceOfTAlias(statement.tables[i].tableName)) {
            let tn : TAlias = statement.tables[i].tableName as TAlias;
            if (instanceOfTLiteral(tn.name)) {
                tableToOpen = (tn.name as TLiteral).value;
            } else if (instanceOfTTable(tn.name)) {
                tableToOpen = (tn.name as TTable).table;
            } else if (typeof tn.name === "string") {
                tableToOpen = tn.name as string;
            }
            if (instanceOfTLiteral(tn.alias)) {
                alias = (tn.alias as TLiteral).value;
            } else if (typeof alias === "string") {
                alias = (tn.alias as string);
            }
            if (alias === "") {
                alias = tableToOpen;
            }
        }
        if (instanceOfTTable(statement.tables[i].tableName)) {
            tableToOpen = (statement.tables[i].tableName as TTable).table;
            alias = tableToOpen;
        }


        let tbl = DBData.instance.getTable(tableToOpen);
        let def = readTableDefinition(tbl.data);
        let cursor = readFirst(tbl, def);
        let rowLength = recordSize(tbl.data) + 5;
        ret.push({name: tableToOpen, alias: alias, table: tbl, def: def, cursor: cursor, rowLength: rowLength});

    }

    return ret;
}