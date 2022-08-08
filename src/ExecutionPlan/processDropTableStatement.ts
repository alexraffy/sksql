import {TExecutionContext} from "./TExecutionContext";
import {TQueryDropTable} from "../Query/Types/TQueryDropTable";
import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TParserError} from "../API/TParserError";
import {rollback} from "./rollback";
import {TSQLResult} from "../API/TSQLResult";
import {genStatsForTable} from "../API/genStatsForTable";

// Process a DROP TABLE statement
//
// We check if a foreign constraint exists on this table, if that's the case, we cannot drop it.
//

export function processDropTableStatement(db: SKSQL, context: TExecutionContext, st: TQueryDropTable) {
    let tableName = getValueForAliasTableOrLiteral(st.table).table.toUpperCase();
    if (tableName === "DUAL" || tableName === "ROUTINES" || tableName === "SYS_TABLE_STATISTICS") {
        return;
    }

    if (context.accessRights !== undefined && context.accessRights.indexOf("W") === -1) {
        throw new TParserError("DROP TABLE: NO WRITE ACCESS.");
    }

    let allTables = db.allTables;
    for (let i = 0; i < allTables.length; i++) {
        let def = readTableDefinition(allTables[i].data, true);
        if (def !== undefined && def.name.toUpperCase() !== tableName && def.constraints !== undefined) {
            for (let x = 0; x < def.constraints.length; x++) {
                if (def.constraints[x].foreignKeyTable !== undefined && def.constraints[x].foreignKeyTable.toUpperCase() === tableName) {
                    return rollback(db, context, "THE TABLE " + tableName + " CANNOT BE DROPPED BECAUSE AN OTHER TABLE (" + def.name.toUpperCase() + ") HAS A FOREIGN KEY CONSTRAINT REFERENCING THIS TABLE.");
                    break;
                }
            }
        }
    }
    db.dropTable(tableName);

    if (db.callbackDropTable !== undefined) {
        db.callbackDropTable(db, tableName);
    }



    context.broadcastQuery = true;

    if (context.result.dropTable === undefined) {
        context.result.dropTable = [tableName];
    } else {
        context.result.dropTable.push(tableName);
    }


}