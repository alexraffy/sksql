import {padLeft} from "../../Date/padLeft";
import {TableColumnType} from "../../Table/TableColumnType";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


// SQL function PADLEFT


export function string_padLeft(context: TExecutionContext, input: string, padWith: string, num: number) {
    if (input === undefined) { return undefined; }
    return padLeft(input, num, padWith)
}