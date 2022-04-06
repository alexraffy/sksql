import {TExecutionContext} from "./TExecutionContext";

// Copy the result table from a context into a new one.
// This is used when a query calls a stored proc and that stored proc contains a SELECT statement

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