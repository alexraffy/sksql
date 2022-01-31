import {numeric} from "../../Numeric/numeric";
import {numericLoad} from "../../Numeric/numericLoad";
import {numericAdd} from "../../Numeric/numericAdd";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function aggregate_sum(context: TExecutionContext, groupInfo: any, input: numeric): any {
    if (groupInfo === undefined) {
        return {
            sum: numericLoad("0")
        }
    }
    if (input !== undefined) {
        groupInfo.sum = numericAdd(groupInfo.sum, input);
        return groupInfo;
    }
    return groupInfo.sum;

}