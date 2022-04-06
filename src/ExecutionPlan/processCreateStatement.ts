import {instanceOfTQueryCreateTable} from "../Query/Guards/instanceOfTQueryCreateTable";
import {TQueryCreateTable} from "../Query/Types/TQueryCreateTable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {TableColumnType} from "../Table/TableColumnType";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {TColumn} from "../Query/Types/TColumn";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {newTable} from "../Table/newTable";
import {SQLResult} from "../API/SQLResult";
import {serializeTQuery} from "../API/serializeTQuery";
import {SKSQL} from "../API/SKSQL";
import {TParserError} from "../API/TParserError";
import {typeString2TableColumnType} from "../API/typeString2TableColumnType";
import {TExecutionContext} from "./TExecutionContext";
import {readTableDefinition} from "../Table/readTableDefinition";
import {recordSize} from "../Table/recordSize";
import {readFirst} from "../Cursor/readFirst";
import {TTableConstraint} from "../Table/TTableConstraint";
import {kTableConstraintType} from "../Table/kTableConstraintType";
import {genStatsForTable} from "../API/genStatsForTable";


// Process a CREATE TABLE statement
//
//

export function processCreateStatement(db: SKSQL, context: TExecutionContext, statement: TQueryCreateTable): SQLResult {
    if (instanceOfTQueryCreateTable(statement)) {
        let c: TQueryCreateTable = statement;
        let tblDef = {
            name: c.name.table,
            columns: [],
            hasIdentity: c.hasIdentity,
            identityColumnName: c.identityColumnName,
            identitySeed: parseInt(c.identitySeed.toString()),
            identityIncrement: parseInt(c.identityIncrement.toString()),
            constraints: c.constraints
        } as ITableDefinition;
        for (let i = 0; i < c.columns.length; i++) {
            let col = c.columns[i];
            let type = undefined;
            let nullable = col.type.isNullable.value;
            type = typeString2TableColumnType(col.type.type.toUpperCase());

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
        if (db.getTable(tblDef.name) !== undefined) {
            throw new TParserError("Table " + tblDef.name + " already exists.");
        }

        // CHECK THE FOREIGN KEY CONSTRAINTS
        if (tblDef.constraints.length > 0) {
            for (let i = 0; i < tblDef.constraints.length; i++) {
                if (tblDef.constraints[i].type === kTableConstraintType.foreignKey) {
                    let c = tblDef.constraints[i];
                    if (c.columns.length !== c.foreignKeyColumnsRef.length) {
                        let ptrConstraint: TTableConstraint[];
                        let fkPrimaryKeys = [];
                        let fkPK = "";
                        if (tblDef.name.toUpperCase() === c.foreignKeyTable.toUpperCase()) {
                            ptrConstraint = tblDef.constraints;
                        } else {
                            let tblFK = db.getTable(c.foreignKeyTable);
                            let tblFKDef = readTableDefinition(tblFK.data, false);
                            ptrConstraint = tblFKDef.constraints;
                        }

                        ptrConstraint.forEach((c) => {
                            if (c.type === kTableConstraintType.primaryKey && fkPK === "") {
                                fkPK = c.columns[0].name;
                            }
                            if (c.type === kTableConstraintType.primaryKey || c.type === kTableConstraintType.unique) {
                                c.columns.forEach((cc) => {
                                    fkPrimaryKeys.push(cc.name.toUpperCase());
                                })
                            }
                        });

                        for (let x = 0; x < c.columns.length; x++) {
                            if (fkPrimaryKeys.includes(c.columns[x].name.toUpperCase())) {
                                c.foreignKeyColumnsRef.push(c.columns[x].name);
                            } else {
                                c.foreignKeyColumnsRef.push(fkPK)
                            }
                        }

                    }
                }
            }


        }


        newTable(db, tblDef);
        if (!["DUAL", "ROUTINES", "SYS_TABLE_STATISTICS"].includes(tblDef.name.toUpperCase())) {
            genStatsForTable(db, tblDef.name);
        }


        if (context.result.messages === undefined) {
            context.result.messages = "CREATE TABLE";
        } else {
            context.result.messages += "\r\n" + "CREATE TABLE";
        }
        context.broadcastQuery = true;
        return;
    }
    if (context.result.error === undefined) {
        context.result.error = "Misformed CREATE TABLE query.";
    } else {
        context.result.error += "\r\n" + "Misformed CREATE TABLE query.";
    }
}