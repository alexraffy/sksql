import {numericLoad} from "../../Numeric/numericLoad";
import {numeric} from "../../Numeric/numeric";
import {numericToNumber} from "../../Numeric/numericToNumber";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function scalar_power(context: TExecutionContext, base: numeric, exponent: numeric) {
    let _base = numericToNumber(base);
    let _exponent = numericToNumber(exponent);
    return numericLoad(Math.pow(_base, _exponent).toString());
}