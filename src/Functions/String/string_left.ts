import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function LEFT

export function string_left(context: TExecutionContext, input: string, length: number) {
    if (input === undefined) { return undefined; }
    return input.substr(0, length);
}