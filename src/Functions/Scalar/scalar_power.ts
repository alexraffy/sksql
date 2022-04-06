import {numericLoad} from "../../Numeric/numericLoad";
import {numeric} from "../../Numeric/numeric";
import {numericToNumber} from "../../Numeric/numericToNumber";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {isNumeric} from "../../Numeric/isNumeric";

// SQL function POWER
// Raise base to the specified power

export function scalar_power(context: TExecutionContext, base: numeric | number, exponent: numeric | number): number | numeric {
    let b = 0;
    let e = 0;
    if (typeof base === "number") {
        b = base;
    }
    if (typeof exponent === "number") {
        e = exponent;
    }
    if (isNumeric(base)) {
        b = numericToNumber(base);
    }
    if (isNumeric(exponent)) {
        e = numericToNumber(exponent);
    }
    let result = Math.pow(b, e);
    if (typeof base === "number") {
        return result;
    } else {
        return numericLoad(result.toString());
    }

}