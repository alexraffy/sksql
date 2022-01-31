import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function string_rtrim(context: TExecutionContext, input: string) {
    if (input === undefined) { return undefined; }
    let ret = input;
    while (ret.length > 0 && ret[ret.length -1] === " ") {
        ret = ret.substr(0, ret.length - 1);
    }
    return ret;
}