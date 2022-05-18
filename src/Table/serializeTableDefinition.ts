import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "./readTableDefinition";
import {serializeTQuery} from "../API/serializeTQuery";
import {kTableConstraintType} from "./kTableConstraintType";
import {ITable} from "./ITable";
import {tableColumnType2String} from "./tableColumnType2String";
import {foreignKeyCascadeEnum2String} from "./foreignKeyCascadeEnum2String";


export function serializeTableDefinition(db: SKSQL, tableName: string): string {
    let table: ITable = db.getTable(tableName);
    if (table === undefined) {
        return ""
    }
    let def = readTableDefinition(table.data);
    if (def === undefined) {
        return "";
    }
    let ret = `CREATE TABLE ${def.name} (\n`;
    ret += "\t";
    for (let i = 0; i < def.columns.length; i++) {
        if (def.columns[i].invisible === true) {
            continue;
        }
        let col = def.columns[i];
        ret += `\t${col.name} ${tableColumnType2String(col.type, col.length, col.decimal)}`;
        if (def.identityColumnName.toUpperCase() === col.name.toUpperCase()) {
            ret += ` IDENTITY(${def.identitySeed},${def.identityIncrement}) `;
        }
        ret += ` ${(col.nullable === true ? "NULL" : "")}${" " + col.defaultExpression}`;
        if (i < def.columns.length -1 || def.constraints.length > 0) {
            ret += ",";
        }
        ret += "\n";
    }
    for (let i = 0; i < def.constraints.length; i++) {
        let c = def.constraints[i];
        c.constraintName
        ret += `\tCONSTRAINT ${c.constraintName} `;
        switch (c.type) {
            case kTableConstraintType.primaryKey:
            case kTableConstraintType.unique: {
                ret += `PRIMARY KEY${(c.clustered ? " CLUSTERED" : " NON CLUSTERED")} (`;
                for (let x = 0; x < c.columns.length; x++) {
                    ret += c.columns[x].name;
                    if (c.columns[x].ascending === true) {
                        ret += " ASC";
                    } else {
                        ret += " DESC";
                    }
                    if (x < c.columns.length - 1) {
                        ret += ", ";
                    }
                }
                ret += ")";
            }
                break;
            case kTableConstraintType.check: {
                ret += "CHECK (" + serializeTQuery(c.check) + ")";
            }
                break;
            case kTableConstraintType.foreignKey: {
                ret += "FOREIGN KEY (";
                for (let x = 0; x < c.columns.length; x++) {
                    ret += c.columns[x].name;
                    if (x < c.columns.length - 1) {
                        ret += ", ";
                    }
                }
                ret += ")\n";
                ret += `\t\tREFERENCES ${c.foreignKeyTable} (`;
                for (let x = 0; x < c.foreignKeyColumnsRef.length; x++) {
                    ret += c.foreignKeyColumnsRef[x];
                    if (x < c.foreignKeyColumnsRef.length - 1) {
                        ret += ", ";
                    }
                }
                ret += ")\n";
                ret += "\t\tON UPDATE " + foreignKeyCascadeEnum2String(c.foreignKeyOnUpdate) + "\n";
                ret += "\t\tON UPDATE " + foreignKeyCascadeEnum2String(c.foreignKeyOnUpdate) + "\n";

            }
                break;
        }
        if (i < def.constraints.length - 1) {
            ret += ","
        }
        ret += "\n";
    }
    ret += ");\n"
    return ret;

}