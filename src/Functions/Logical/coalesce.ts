import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {findExpressionType} from "../../API/findExpressionType";

// SQL function COALESCE
// return the first non-NULL value in the list of parameters
// https://docs.microsoft.com/en-us/sql/t-sql/language-elements/coalesce-transact-sql?view=sql-server-ver15

export function logical_coalesce(context: TExecutionContext, ...params: any) {
    for (let i = 0; i < params.length; i++) {
        let p = params[i];
        if (p !== undefined) {
            return p;
        }
    }
    return undefined;
}