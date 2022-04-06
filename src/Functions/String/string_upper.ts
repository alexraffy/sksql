import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function UPPER


export function string_upper(context: TExecutionContext, input: string) {
    if (input === undefined) { return undefined; }
    return input.toUpperCase();
}