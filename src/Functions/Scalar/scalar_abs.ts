import {numeric} from "../../Numeric/numeric";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {isNumeric} from "../../Numeric/isNumeric";


export function scalar_abs(context: TExecutionContext, input: number | numeric) {
    if (isNumeric(input)) {
        if (input.sign === 1) {
            return {
                sign: 0,
                m: input.m,
                e: input.e,
                approx: input.approx
            } as numeric
        }
    } else {
        return Math.abs(input);
    }
}