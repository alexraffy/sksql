import {numeric} from "../Numeric/numeric";
import {TDateTime} from "../Query/Types/TDateTime";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TableColumnType} from "../Table/TableColumnType";
import {TQueryCreateProcedure} from "../Query/Types/TQueryCreateProcedure";
import {TExecute} from "../Query/Types/TExecute";
import {processStatement} from "./processStatement";
import {TExecutionContext} from "./TExecutionContext";


export function runProcedure(context: TExecutionContext, st: TExecute,
                             proc: TQueryCreateProcedure
                             ) {
    let ret: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime = undefined;

    let newContext = {
        label: proc.procName,
        stack: context.stack,
        breakLoop: false,
        exitExecution: false,
        returnValue: undefined,
        openTables: context.openTables,
        scopedIdentity: context.scopedIdentity,
        openedTempTables: [],
        broadcastQuery: false,
        results: [],
        query: context.query,
        parseResult: context.parseResult
    } as TExecutionContext

    for (let i = 0; i < proc.ops.length; i++) {
        processStatement(newContext, proc.ops[i]);
        //@ts-ignore
        if (newContext.exitExecution === true) {
            return ret;
        }
        //@ts-ignore
        if (newContext.breakLoop === true) {
            //exitCurrentLoop = false;
            break;
        }
    }
    context.stack = newContext.stack;
    context.exitExecution = newContext.exitExecution;
    context.breakLoop = newContext.breakLoop;
    context.scopedIdentity = newContext.scopedIdentity;



}