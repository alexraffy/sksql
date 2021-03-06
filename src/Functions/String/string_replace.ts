import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function REPLACE


export function string_replace(context: TExecutionContext, input: string, replace: string, withString: string) {
    if (input === undefined) { return undefined; }
    let ret = input;
    let occ = ret.indexOf(replace);
    while (occ > -1) {
        ret = ret.replace(replace, withString);
        occ = ret.indexOf(replace);
    }
    return ret;
}