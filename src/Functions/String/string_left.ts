import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_left(context: TExecutionContext, input: string, length: number) {
    if (input === undefined) { return undefined; }
    return input.substr(0, length);
}