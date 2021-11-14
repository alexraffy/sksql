import {numericCmp} from "../../Numeric/numericCmp";
import {numeric} from "../../Numeric/numeric";


export function aggregate_max(groupInfo: any, input: numeric) {
    if (groupInfo === undefined) {
        groupInfo = {
            value: undefined
        };
    }
    if (input !== undefined) {
        if (groupInfo.value === undefined) {
            groupInfo.value = input;
        } else {
            let cmp = numericCmp(groupInfo.value, input);
            if (cmp === -1) {
                groupInfo.value = input;
            }
        }
        return groupInfo;
    }
    return groupInfo.value;
}