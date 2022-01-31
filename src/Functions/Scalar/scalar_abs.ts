import {numeric} from "../../Numeric/numeric";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function scalar_abs(context: TExecutionContext, input: numeric) {
    if (input.sign === 1) {
        return {
            sign: 0,
            m: input.m,
            e: input.e,
            approx: input.approx
        } as numeric
    }
}