import {numeric} from "../Numeric/numeric";
import {TDateTime} from "../Query/Types/TDateTime";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TQueryCreateProcedure} from "../Query/Types/TQueryCreateProcedure";
import {TExecute} from "../Query/Types/TExecute";
import {processStatement} from "./processStatement";
import {TExecutionContext} from "./TExecutionContext";
import {cloneContext} from "./cloneContext";
import {swapContext} from "./swapContext";
import {SKSQL} from "../API/SKSQL";
import {SQLStatement} from "../API/SQLStatement";
import {kResultType} from "../API/kResultType";

// run all operations in a stored proc

export function runProcedure(db: SKSQL, context: TExecutionContext, st: TExecute,
                             proc: TQueryCreateProcedure
                             ) {
    let ret: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime = undefined;

    let newContext = cloneContext(context, proc.procName, true, true);
    newContext.query = context.query;
    if (newContext.query === "") {
        let rt = new SQLStatement(db, "SELECT definition from routines where UPPER(name) = @procName", false);
        rt.setParameter("@procName", proc.procName.toUpperCase());
        let rtRet: any[] = rt.run(kResultType.JSON) as any[]
        if (rtRet.length > 0) {
            newContext.query = rtRet[rtRet.length-1]["definition"];
        }
    }

    for (let i = 0; i < proc.ops.length; i++) {
        newContext.currentStatement = proc.ops[i];
        processStatement(db, newContext, proc.ops[i]);
        //@ts-ignore
        if (newContext.exitExecution === true) {
            break;
        }
        //@ts-ignore
        if (newContext.breakLoop === true) {
            //exitCurrentLoop = false;
            break;
        }
    }
    swapContext(context, newContext);
    context.stack = newContext.stack;
    context.exitExecution = false;
    context.breakLoop = false;
    context.scopedIdentity = newContext.scopedIdentity;
    context.broadcastQuery = newContext.broadcastQuery;



}