import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_upper(context: TExecutionContext, input: string) {
    if (input === undefined) { return undefined; }
    return input.toUpperCase();
}