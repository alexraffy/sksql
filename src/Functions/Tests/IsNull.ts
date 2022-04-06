import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function ISNULL
// Return first parameter if it's not NULL: the second parameter if not.

export function tests_IsNull(context: TExecutionContext, something: any, replaceWith: any) {
    if (something !== undefined) {
        return something;
    }
    return replaceWith;
}