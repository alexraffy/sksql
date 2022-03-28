import {TExecutionContext} from "./TExecutionContext";
import {TQueryDropFunction} from "../Query/Types/TQueryDropFunction";
import {SKSQL} from "../API/SKSQL";
import {SQLStatement} from "../API/SQLStatement";


export function processDropFunctionStatement(db: SKSQL, context: TExecutionContext, st: TQueryDropFunction) {

    db.dropFunction(st.funcName);

    let sql = "DELETE FROM master.routines WHERE name = @name AND TYPE = 'FUNCTION';";
    let deleteFunction = new SQLStatement(db, sql, false);
    deleteFunction.setParameter("@name", st.funcName.toUpperCase());
    deleteFunction.run();

    context.broadcastQuery = true;
}