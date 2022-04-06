import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function LEN


export function string_len(context: TExecutionContext, input: string) {
    if (input === undefined) {
        return undefined;
    }
    return input.length;
}