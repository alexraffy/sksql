import {TExecutionContext} from "./TExecutionContext";
import {TQueryDropFunction} from "../Query/Types/TQueryDropFunction";
import {SKSQL} from "../API/SKSQL";
import {SQLStatement} from "../API/SQLStatement";
import {TParserError} from "../API/TParserError";

// Process a DROP FUNCTION statement
//
// The function is deleted right away from the SQL engine and the function definition is removed from table routines.


export function processDropFunctionStatement(db: SKSQL, context: TExecutionContext, st: TQueryDropFunction) {

    if (context.accessRights !== undefined && context.accessRights.indexOf("W") === -1) {
        throw new TParserError("DROP FUNCTION: NO WRITE ACCESS.");
    }

    db.dropFunction(st.funcName);

    let sql = "DELETE FROM master.routines WHERE name = @name AND TYPE = 'FUNCTION';";
    let deleteFunction = new SQLStatement(db, sql, false, "RW");
    deleteFunction.setParameter("@name", st.funcName.toUpperCase());
    deleteFunction.runSync();

    context.broadcastQuery = true;
}