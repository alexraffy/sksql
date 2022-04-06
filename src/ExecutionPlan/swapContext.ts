import {TExecutionContext} from "./TExecutionContext";

// swap back to an old context

export function swapContext(backToContext: TExecutionContext, fromContext: TExecutionContext) {

    backToContext.rollback = fromContext.rollback;
    backToContext.rollbackMessage = fromContext.rollbackMessage;
    backToContext.breakLoop = fromContext.breakLoop;
    backToContext.exitExecution = fromContext.exitExecution;
    backToContext.scopedIdentity = fromContext.scopedIdentity;
    backToContext.result = fromContext.result;
    for (let i = 0; i < fromContext.openedTempTables.length; i++) {
        let exists = backToContext.openedTempTables.find((ott) => { return ott.toUpperCase() === fromContext.openedTempTables[i].toUpperCase();});
        if (exists === undefined) {
            backToContext.openedTempTables.push(fromContext.openedTempTables[i]);
        }
    }
}