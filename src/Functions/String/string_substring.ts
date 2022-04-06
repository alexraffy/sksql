import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function SUBSTRING


export function string_substring(context: TExecutionContext, input: string, start: number, length: number) {
    if (input === undefined) { return undefined; }
    return input.substr(start-1, length);
}