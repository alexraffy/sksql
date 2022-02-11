import {TExecutionContext} from "./TExecutionContext";


export function addNewestResultToList(context: TExecutionContext, newContext: TExecutionContext) {
    if (newContext.result.error !== undefined) {
        if (context.result.error === undefined) {
            context.result.error = newContext.result.error;
        } else {
            context.result.error += "\r\n" + newContext.result.error;
        }
    }
    if (newContext.result.resultTableName !== undefined && newContext.result.resultTableName !== "") {
        context.result.resultTableName = newContext.result.resultTableName;
    }

}