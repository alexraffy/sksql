import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TLiteral} from "../Query/Types/TLiteral";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {TTable} from "../Query/Types/TTable";
import {SKSQL} from "./SKSQL";
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
import {TParserError} from "./TParserError";
import {instanceOfTQueryInsert} from "../Query/Guards/instanceOfTQueryInsert";
import {instanceOfTQuerySelect} from "../Query/Guards/instanceOfTQuerySelect";
import {instanceOfTQueryUpdate} from "../Query/Guards/instanceOfTQueryUpdate";
import {stat} from "fs";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";

function openTable(table: TAlias | TTable): TTableWalkInfo[] {
    let ret = [];
    let tableToOpen = "";
    let alias = "";
    if (table === undefined) { return []; }
    if (instanceOfTAlias(table)) {
        let tn : TAlias = table as TAlias;
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
    if (instanceOfTTable(table)) {
        tableToOpen = (table as TTable).table;
        alias = tableToOpen;
    }


    let tbl = SKSQL.instance.getTable(tableToOpen);
    if (tbl === undefined) {
        throw new TParserError("Table " + tableToOpen + " not found.");
    }
    let def = readTableDefinition(tbl.data);
    let cursor = readFirst(tbl, def);
    let rowLength = recordSize(tbl.data) + 5;
    ret.push({name: tableToOpen, alias: alias, table: tbl, def: def, cursor: cursor, rowLength: rowLength});
    return ret;
}


export function openTables(statement: TQuerySelect | TQueryUpdate | TQueryDelete | TQueryInsert): TTableWalkInfo[] {
    let ret : TTableWalkInfo[] = [];

    if (instanceOfTQueryInsert(statement) || instanceOfTQueryUpdate(statement)) {
        ret.push(...openTable(statement.table));
    }
    if (instanceOfTQuerySelect(statement) || instanceOfTQueryUpdate(statement) || instanceOfTQueryDelete(statement)) {
        for (let i = 0; i < statement.tables.length; i++) {
            ret.push(...openTable(statement.tables[i].tableName));
        }
    }

    return ret;
}