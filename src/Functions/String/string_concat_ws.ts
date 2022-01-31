import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_concat_ws(context: TExecutionContext, sep: string, ...args: string[]) {
    let ret: string = "";
    for (var i = 0; i < args.length; i++) {
        if (args[i] !== undefined) {
            ret = ret + args[i];
            if (i + 1 < args.length && args[i + 1] !== undefined) {
                ret = ret + sep;
            }
        }
    }
    return ret;
}