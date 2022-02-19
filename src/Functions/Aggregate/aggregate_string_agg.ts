import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function aggregate_string_agg(context: TExecutionContext, groupInfo: any, input: string, sep: string) {
    if (groupInfo === undefined) {
        groupInfo = {
            value: ""
        }
        return groupInfo;
    }
    if (input !== undefined && sep !== undefined) {
        groupInfo.value = groupInfo.value + sep + input;
        return groupInfo;
    }
    if (groupInfo.value.length > 0) {
        return groupInfo.value.substr(1);
    }
    return groupInfo.value;

}