import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function CHOOSE
// return parameter at 1-based index <index>
// https://docs.microsoft.com/en-us/sql/t-sql/functions/logical-functions-choose-transact-sql?view=sql-server-ver15

export function logical_choose(context: TExecutionContext, index: number, ...params: any[]) {
    if (index < 1) {
        return undefined;
    }
    if (index > params.length) {
        return undefined;
    }
    return params[index-1];
}