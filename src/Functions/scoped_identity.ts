import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";


export function scoped_identity(context: TExecutionContext) {
    return context.scopedIdentity;
}