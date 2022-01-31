import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_right(context: TExecutionContext, input: string, length: number) {
    if (input === undefined) { return undefined; }
    return input.substr((input.length -1) - length);
}