import {numeric, NUMERIC_MAX_EXP, NUMERIC_NAN_EXP} from "./numeric";
import {numericAdjustExponent} from "./numericAdjustExponent";
import {numericAdd} from "./numericAdd";
import {numericWillOverflow} from "./numericMulOverflow";

/*
    substract two numerics
 */
export function numericSub(a: numeric, b: numeric): numeric {
    if (a.sign !== b.sign) {
        b.sign = a.sign;
        return numericAdd(a, b);
    }
    if (a.e > NUMERIC_MAX_EXP || b.e > NUMERIC_MAX_EXP) {
        return {
            sign: a.sign,
            e: NUMERIC_NAN_EXP,
            m: 0
        } as numeric
    }
    let adj = numericAdjustExponent(a, b);
    a = adj.a;
    b = adj.b;
    if (b.m > a.m) {
        let t: numeric = {
            sign: a.sign,
            m: a.m,
            e: a.e,
            approx: a.approx
        };
        a = b;
        b = t;
        a.sign = 1-a.sign;
    }
    return numericWillOverflow({
        sign: a.sign,
        m: a.m - b.m,
        e: a.e,
        approx: a.approx | b.approx
    } as numeric);
}