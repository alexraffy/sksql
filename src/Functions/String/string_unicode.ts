import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_unicode(context: TExecutionContext, input: string): number {
    if (input === undefined || typeof input !== "string") { return undefined; }
    return input.codePointAt(0);

}