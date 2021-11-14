import {numericLoad} from "../../Numeric/numericLoad";
import {numeric} from "../../Numeric/numeric";
import {numericAdd} from "../../Numeric/numericAdd";


export function aggregate_avg(groupInfo: any, input: numeric) {
    if (groupInfo === undefined) {
        groupInfo = {
            value: numericLoad("0"),
            count: 0
        }
    }
    if (input !== undefined) {
        groupInfo.value = numericAdd(groupInfo.value, input);
        return groupInfo;
    }
    groupInfo.value.m = groupInfo.value.m / groupInfo.count;
    return groupInfo.value;

}