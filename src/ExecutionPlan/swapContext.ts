import {TExecutionContext} from "./TExecutionContext";


export function swapContext(backToContext: TExecutionContext, fromContext: TExecutionContext) {

    backToContext.rollback = fromContext.rollback;
    backToContext.rollbackMessage = fromContext.rollbackMessage;
    backToContext.breakLoop = fromContext.breakLoop;
    backToContext.exitExecution = fromContext.exitExecution;
    backToContext.scopedIdentity = fromContext.scopedIdentity;

}