import {numeric, NUMERIC_MAX_EXP} from "./numeric";
import {numericSub} from "./numericSub";
import {numericAdjustExponent} from "./numericAdjustExponent";
import {numericWillOverflow} from "./numericMulOverflow";

/*
    returns the sum of two numerics

 */
export function numericAdd(a: numeric, b: numeric): numeric {
    let r: number;
    if (a.sign !== b.sign) {
        if (a.sign) {
            return numericSub(b, {
                sign: 0,
                m: a.m,
                e: a.e,
                approx: a.approx
            });
        } else {
            return numericSub(a, {
                sign: 0,
                m: b.m,
                e: b.e,
                approx: b.approx
            });
        }
    }
    if( a.e > NUMERIC_MAX_EXP ){
        if( b.e> NUMERIC_MAX_EXP && b.m === 0 ) {
            return b;
        }
        return a;
    }
    if( b.e > NUMERIC_MAX_EXP ){
        return b;
    }
    let adj = numericAdjustExponent(a, b);
    a = adj.a;
    b = adj.b;
    r = a.m + b.m;
    a.approx |= b.approx;
    if( r >= a.m ){
        a.m = r;
    }else{
        if( a.approx === 0 && (a.m % 10) !== 0 ) {
            a.approx = 1;
        }
        a.m /= 10;
        a.e++;
        if( a.e > NUMERIC_MAX_EXP ) {
            return a;
        }
        if( a.approx === 0 && (b.m % 10) !== 0 ) {
            a.approx = 1;
        }
        a.m += b.m / 10;
    }
    return numericWillOverflow(a);
}