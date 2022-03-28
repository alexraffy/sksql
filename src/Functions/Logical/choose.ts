import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function logical_choose(context: TExecutionContext, index: number, ...params: any[]) {
    if (index < 1) {
        return undefined;
    }
    if (index > params.length) {
        return undefined;
    }
    return params[index-1];
}