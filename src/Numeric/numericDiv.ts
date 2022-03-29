import {numeric, NUMERIC_MAX, NUMERIC_MAX_EXP, NUMERIC_NAN_EXP} from "./numeric";
import {numericRound} from "./numericRound";
import {numericWillOverflow} from "./numericMulOverflow";


export function numericDiv(A: numeric, B: numeric, d: number = 2): numeric {
    let a: numeric = {
        e: A.e,
        m: A.m,
        sign: A.sign,
        approx: A.approx
    };
    let b: numeric = {
        e: B.e,
        m: B.m,
        sign: B.sign,
        approx: B.sign
    };

    let ret: numeric = {
        e: 0,
        m: 0,
        sign: 0,
        approx: 0
    }

    if( a.e > NUMERIC_MAX_EXP ){
        a.m = 0;
        return a;
    }
    if( b.e > NUMERIC_MAX_EXP ){
        if( b.m!=0 ){
            ret.m = 0;
            ret.e = 0;
            ret.sign = 0;
            ret.approx = 1;
            return ret;
        }
        return b;
    }
    if( b.m==0 ){
        ret.sign = A.sign ^ B.sign;
        ret.e = NUMERIC_NAN_EXP;
        ret.m = 0;
        ret.approx = 1;
        return ret;
    }
    if( a.m==0 ){
        return a;
    }
    while( a.m < NUMERIC_MAX ){
        a.m *= 10;
        a.e--;
    }
    while( b.m%10==0 ){
        b.m /= 10;
        b.e++;
    }
    ret.sign = a.sign ^ b.sign;
    ret.approx = a.approx | b.approx;
    if( ret.approx==0 && a.m % b.m!=0 ) ret.approx = 1;
    ret.m = parseInt((a.m / b.m).toString());
    ret.e = a.e - b.e;

    while (ret.m % 10 === 0) {
        ret.m /= 10;
        ret.e++;
    }


    return numericWillOverflow(ret);


}