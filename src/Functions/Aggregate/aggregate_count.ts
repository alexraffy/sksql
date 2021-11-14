import {numericLoad} from "../../Numeric/numericLoad";
import {numericAdd} from "../../Numeric/numericAdd";
import {TableColumnType} from "../../Table/TableColumnType";


export function aggregate_count(groupInfo: any, input: any) {
    if (groupInfo === undefined) {
        groupInfo = {
            count: numericLoad("0")
        }
    }
    if (input !== undefined) {
        groupInfo.count = numericAdd(groupInfo.count, numericLoad("1"));
        return groupInfo;
    }
    return groupInfo.count;
}