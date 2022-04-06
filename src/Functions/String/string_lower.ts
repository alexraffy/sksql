import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function LOWER


export function string_lower(context: TExecutionContext, input: string) {
    if (input === undefined) { return undefined; }
    return input.toLowerCase();
}