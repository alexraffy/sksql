import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function tests_exists(context: TExecutionContext, value: any) {
    return value !== undefined;
}