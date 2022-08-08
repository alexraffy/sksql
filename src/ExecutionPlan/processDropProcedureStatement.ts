import {SKSQL} from "../API/SKSQL";
import {TExecutionContext} from "./TExecutionContext";
import {TQueryDropProcedure} from "../Query/Types/TQueryDropProcedure";
import {TParserError} from "../API/TParserError";
import {SQLStatement} from "../API/SQLStatement";

// Process a DROP PROCEDURE statement
//
// The procedure is deleted right away from the SQL engine and the procedure definition is removed from table routines.

export function processDropProcedureStatement(db: SKSQL, context: TExecutionContext, st: TQueryDropProcedure) {
    if (context.accessRights !== undefined && context.accessRights.indexOf("W") === -1) {
        throw new TParserError("DROP PROCEDURE: NO WRITE ACCESS.");
    }

    db.dropProcedure(st.procName);

    let sql = "DELETE FROM master.routines WHERE name = @name AND TYPE = 'PROCEDURE';";
    let deleteFunction = new SQLStatement(db, sql, false);
    deleteFunction.setParameter("@name", st.procName.toUpperCase());
    deleteFunction.runSync();

    context.broadcastQuery = true;
}