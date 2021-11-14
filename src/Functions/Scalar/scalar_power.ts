import {numericLoad} from "../../Numeric/numericLoad";
import {numeric} from "../../Numeric/numeric";
import {numericToNumber} from "../../Numeric/numericToNumber";


export function scalar_power(base: numeric, exponent: numeric) {
    let _base = numericToNumber(base);
    let _exponent = numericToNumber(exponent);
    return numericLoad(Math.pow(_base, _exponent).toString());
}