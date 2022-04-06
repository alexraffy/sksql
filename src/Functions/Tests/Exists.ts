import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function EXISTS
// returns TRUE if the value is NOT NULL

export function tests_exists(context: TExecutionContext, value: any) {
    return value !== undefined;
}