import {TExecutionContext} from "./TExecutionContext";
import {createNewContext} from "./newContext";
import {ParseResult} from "../BaseParser/ParseResult";


export function cloneContext(context: TExecutionContext, label: string, keepStack: boolean, keepTables: boolean): TExecutionContext {

    let newContext = createNewContext(label, "", context.parseResult as ParseResult);
    newContext.currentStatement = undefined;
    newContext.stack = (keepStack === false) ? [] : context.stack;
    newContext.result = context.result;
    newContext.broadcastQuery = context.broadcastQuery;
    newContext.rollbackMessage = context.rollbackMessage;
    newContext.rollback = context.rollback;
    newContext.scopedIdentity = context.scopedIdentity;
    newContext.exitExecution = false;
    newContext.breakLoop = false;
    newContext.transactionId = context.transactionId;
    newContext.returnValue = context.returnValue;
    newContext.openedTempTables = context.openedTempTables;
    return newContext;
}