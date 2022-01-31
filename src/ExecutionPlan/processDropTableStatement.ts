import {TExecutionContext} from "./TExecutionContext";
import {TQueryDropTable} from "../Query/Types/TQueryDropTable";
import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TParserError} from "../API/TParserError";
import {rollback} from "./rollback";


export function processDropTableStatement(context: TExecutionContext, st: TQueryDropTable) {
    let tableName = getValueForAliasTableOrLiteral(st.table).table.toUpperCase();
    let allTables = SKSQL.instance.allTables;
    for (let i = 0; i < allTables.length; i++) {
        let def = readTableDefinition(allTables[i].data, true);
        if (def.name.toUpperCase() !== tableName && def.constraints !== undefined) {
            for (let x = 0; x < def.constraints.length; x++) {
                if (def.constraints[x].foreignKeyTable !== undefined && def.constraints[x].foreignKeyTable.toUpperCase() === tableName) {
                    return rollback(context, "THE TABLE " + tableName + " CANNOT BE DROPPED BECAUSE AN OTHER TABLE (" + def.name.toUpperCase() + ") HAS A FOREIGN KEY CONSTRAINT REFERENCING THIS TABLE.");
                    break;
                }
            }
        }
    }
    SKSQL.instance.dropTable(tableName);
    for (let i = 0; i < context.openTables.length; i++) {
        if (context.openTables[i].name.toUpperCase() === tableName) {
            context.openTables.splice(i, 1);
            break;
        }
    }

}