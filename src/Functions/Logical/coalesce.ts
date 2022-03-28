import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {findExpressionType} from "../../API/findExpressionType";



export function logical_coalesce(context: TExecutionContext, ...params: any) {
    for (let i = 0; i < params.length; i++) {
        let p = params[i];
        if (p !== undefined) {
            return p;
        }
    }
    return undefined;
}