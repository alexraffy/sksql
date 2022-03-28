import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function aggregate_string_agg(context: TExecutionContext, mode: "init" | "row" | "final", isDistinct: boolean, groupInfo: any, input: string, sep: string) {
    if (mode === "init") {
        groupInfo = {
            value: ""
        }
        return groupInfo;
    }
    if (mode === "row") {
        if (input !== undefined && sep !== undefined) {
            groupInfo.value = groupInfo.value + sep + input;
        }
        return groupInfo;
    }
    if (mode === "final") {
        if (groupInfo.value.length > 0) {
            return groupInfo.value.substr(1);
        }
        return groupInfo.value;
    }

}