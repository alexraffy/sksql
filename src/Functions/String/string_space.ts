import {string_replicate} from "./string_replicate";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function SPACE


export function string_space(context: TExecutionContext, num: number) {
    return string_replicate(context, " ", num);
}