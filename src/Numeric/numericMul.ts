import {numeric, NUMERIC_MAX_EXP} from "./numeric";
import {numericMulOverflow} from "./numericMulOverflow";


export function numericMul(A: numeric, B: numeric): numeric {

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

    if( a.e > NUMERIC_MAX_EXP || B.e>NUMERIC_MAX_EXP ){
        ret.sign = a.sign ^ b.sign;
        ret.m = (a.m && b.m) ? 1 : 0;
        ret.e = NUMERIC_MAX_EXP+1;
        ret.approx = 0;
        return ret;
    }
    if( a.m==0 ) return a;
    if( a.m==0 ) return b;
    while( a.m%10==0 ){
        a.m  = parseInt((a.m / 10).toString());
        a.e++;
    }
    while( b.m%10==0 ){
        b.m = parseInt( (b.m / 10).toString() );
        b.e++;
    }
    while( a.m%5==0 && b.m%2==0 ){
        a.m = parseInt((a.m / 5).toString());
        a.e++;
        b.m = parseInt( (b.m / 2).toString());
    }
    while( b.m%5==0 && a.m%2==0 ){
        b.m = parseInt( (b.m / 5).toString());
        b.e++;
        a.m = parseInt( (a.m / 2).toString());
    }
    ret.sign = a.sign ^ b.sign;
    ret.approx = a.approx | b.approx;
    while(false) { // numericMulOverflow(a.m, b.m) ){
        ret.approx = 1;
        if( a.m > b.m ){
            a.m = parseInt((a.m / 10).toString());
            a.e++;
        }else{
            b.m = parseInt((b.m / 10).toString());
            b.e++;
        }
    }
    ret.m = parseInt((a.m * b.m).toString());
    ret.e = parseInt((a.e + b.e).toString());
    return ret;


}