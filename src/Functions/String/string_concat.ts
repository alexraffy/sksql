import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_concat(context: TExecutionContext, ...args:string[]) {
    let ret: string = "";
    for (var i = 0; i < args.length; i++) {
        if (args[i] !== undefined) {
            ret = ret + args[i];
        }
    }
    return ret;
}