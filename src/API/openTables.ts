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


export function openTables(statement: TQuerySelect | TQueryUpdate | TQueryDelete): TTableWalkInfo[] {
    let ret : TTableWalkInfo[] = [];

    for (let i = 0; i < statement.tables.length; i++) {
        let tableToOpen = "";
        let alias = "";
        if (instanceOfTLiteral(statement.tables[i].tableName.name)) {
            tableToOpen = (statement.tables[i].tableName.name as TLiteral).value;
        } else if (instanceOfTTable(statement.tables[i].tableName.name)) {
            tableToOpen = (statement.tables[i].tableName.name as TTable).table;
        } else if (typeof statement.tables[i].tableName.name === "string") {
            tableToOpen = statement.tables[i].tableName.name as string;
        }
        if (instanceOfTLiteral(statement.tables[i].tableName.alias)) {
            alias = (statement.tables[i].tableName.alias as TLiteral).value;
        } else if (typeof alias === "string") {
            alias = (statement.tables[i].tableName.alias as string);
        }
        if (alias === "") {
            alias = tableToOpen;
        }

        let tbl = DBData.instance.getTable(tableToOpen);
        let def = readTableDefinition(tbl.data);
        let cursor = readFirst(tbl, def);
        let rowLength = recordSize(tbl.data) + 5;
        ret.push({name: tableToOpen, alias: alias, table: tbl, def: def, cursor: cursor, rowLength: rowLength});


        // candidates for index walk
        if (statement.tables[i].joinType !== kQueryJoin.from) {

        }

    }

    return ret;
}