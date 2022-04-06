import {string_ltrim} from "./string_ltrim";
import {string_rtrim} from "./string_rtrim";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function TRIM


export function string_trim(context: TExecutionContext, input: string) {
    if (input === undefined) { return undefined; }
    return string_rtrim(context, string_ltrim(context, input));
}