import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";

// SQL function SCOPED_IDENTITY
// return the last identity generated

export function scoped_identity(context: TExecutionContext) {
    return context.scopedIdentity;
}