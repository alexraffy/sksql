import {numericLoad} from "../../Numeric/numericLoad";
import {numeric} from "../../Numeric/numeric";
import {numericAdd} from "../../Numeric/numericAdd";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function aggregate_avg(context: TExecutionContext, groupInfo: any, input: numeric) {
    if (groupInfo === undefined) {
        groupInfo = {
            value: numericLoad("0"),
            count: 0
        }
    }
    if (input !== undefined) {
        groupInfo.value = numericAdd(groupInfo.value, input);
        groupInfo.count = groupInfo.count + 1;
        return groupInfo;
    }
    if (groupInfo.count > 0) {
        groupInfo.value.m = groupInfo.value.m / groupInfo.count;
    }
    return groupInfo.value;

}