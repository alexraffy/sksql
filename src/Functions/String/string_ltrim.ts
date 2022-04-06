import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function LTRIM


export function string_ltrim(context: TExecutionContext, input: string) {
    if (input === undefined) { return undefined; }
    let ret = input;
    while (ret.length > 0 && ret[0] === " ") {
        ret = ret.substr(1);
    }
    return ret;
}