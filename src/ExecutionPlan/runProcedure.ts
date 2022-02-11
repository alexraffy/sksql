import {numeric} from "../Numeric/numeric";
import {TDateTime} from "../Query/Types/TDateTime";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TableColumnType} from "../Table/TableColumnType";
import {TQueryCreateProcedure} from "../Query/Types/TQueryCreateProcedure";
import {TExecute} from "../Query/Types/TExecute";
import {processStatement} from "./processStatement";
import {TExecutionContext} from "./TExecutionContext";
import {createNewContext} from "./newContext";
import {cloneContext} from "./cloneContext";
import {swapContext} from "./swapContext";
import {SKSQL} from "../API/SKSQL";


export function runProcedure(db: SKSQL, context: TExecutionContext, st: TExecute,
                             proc: TQueryCreateProcedure
                             ) {
    let ret: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime = undefined;

    /*
    let newContext = {
        label: proc.procName,
        stack: context.stack,
        breakLoop: false,
        exitExecution: false,
        returnValue: undefined,
        openTables: context.openTables,
        scopedIdentity: context.scopedIdentity,
        openedTempTables: context.openedTempTables,
        broadcastQuery: context.broadcastQuery,
        results: [],
        query: context.query,
        parseResult: context.parseResult
    } as TExecutionContext

     */

    let newContext = cloneContext(context, proc.procName, true, true);


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