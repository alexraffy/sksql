import {numericLoad} from "../../Numeric/numericLoad";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function RAND
// return a numeric between 0.0 and 1.0

export function scalar_rand(context: TExecutionContext) {
    return numericLoad(Math.random().toString());
}