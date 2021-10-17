import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {instanceOfTQueryCreateTable} from "../Query/Guards/instanceOfTQueryCreateTable";
import {TQueryCreateTable} from "../Query/Types/TQueryCreateTable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {TableColumnType} from "../Table/TableColumnType";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TColumn} from "../Query/Types/TColumn";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {newTable} from "../Table/newTable";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {ParseResult} from "../BaseParser/ParseResult";
import {SQLResult} from "./SQLResult";
import {serializeTQuery} from "./serializeTQuery";


export function processCreateStatement(parseResult: ParseResult, statement: TQueryCreateTable): SQLResult {
    if (instanceOfTQueryCreateTable(statement)) {
        let c: TQueryCreateTable = statement;
        let tblDef = {
            name: c.name.table,
            columns: [],
            hasIdentity: c.hasIdentity,
            identityColumnName: c.identityColumnName,
            identitySeed: c.identitySeed,
            identityIncrement: c.identityIncrement,
            constraints: c.constraints
        } as ITableDefinition;
        for (let i = 0; i < c.columns.length; i++) {
            let col = c.columns[i];
            let type = undefined;
            let nullable = col.type.isNullable.value;
            switch (col.type.type.toUpperCase()) {
                case "UINT8":
                    type = TableColumnType.uint8;
                    break;
                case "UINT16":
                    type = TableColumnType.uint16;
                    break;
                case "UINT32":
                    type = TableColumnType.uint32;
                    break;
                case "UINT64":
                    type = TableColumnType.uint64;
                    break;
                case "INT8":
                    type = TableColumnType.int8;
                    break;
                case "INT16":
                    type = TableColumnType.int16;
                    break;
                case "INT32":
                    type = TableColumnType.int32;
                    break;
                case "INT64":
                    type = TableColumnType.int64;
                    break;
                case "INT":
                case "INTEGER":
                    type = TableColumnType.int;
                    break;
                case "VARCHAR":
                    type = TableColumnType.varchar;
                    break;
                case "BOOLEAN":
                    type = TableColumnType.boolean;
                    break;
                case "NUMERIC":
                    type = TableColumnType.numeric;
                    break;
                case "DATE":
                    type = TableColumnType.date;
                    break;

            }
            let length = parseInt(col.type.size.value);
            let decimal = undefined;
            if (col.type.dec !== undefined) {
                decimal = parseInt(col.type.dec.value);
            }
            let name = "";
            if (instanceOfTColumn(col.name)) {
                name = (col.name as TColumn).column;
            } else if (instanceOfTLiteral(col.name)) {
                name = col.name.value;
            } else if (typeof col.name === "string") {
                name = col.name as string;
            }
            tblDef.columns.push(
                {
                    name: name,
                    type: type,
                    length: length,
                    decimal: (type === TableColumnType.numeric) ? decimal : undefined,
                    nullable: nullable,
                    defaultExpression: (col.default !== undefined) ? serializeTQuery(col.default) : "",
                }
            );
        }

        newTable(tblDef);
        return {
            resultTableName: "",
            rowCount: 0
        } as SQLResult
    }
    return {
        error: "Misformed CREATE TABLE query.",
        resultTableName: "",
        rowCount: 0
    }
}