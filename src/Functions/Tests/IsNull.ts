import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function tests_IsNull(context: TExecutionContext, something: any, replaceWith: any) {
    if (something !== undefined) {
        return something;
    }
    return replaceWith;
}