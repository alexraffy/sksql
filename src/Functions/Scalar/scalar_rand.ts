import {numericLoad} from "../../Numeric/numericLoad";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function scalar_rand(context: TExecutionContext) {
    return numericLoad(Math.random().toString());
}