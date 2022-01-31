import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_lower(context: TExecutionContext, input: string) {
    if (input === undefined) { return undefined; }
    return input.toLowerCase();
}