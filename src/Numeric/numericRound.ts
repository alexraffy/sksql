import {numeric, NUMERIC_NAN_EXP} from "./numeric";
import {numericWillOverflow} from "./numericMulOverflow";


export function numericRound(a: numeric, decimals: number) {
    let newA: numeric = {
        sign: a.sign,
        m: a.m,
        e: a.e,
        approx: a.approx
    };
    if( decimals < 0 ) decimals = 0;
    if( newA.e >= -decimals ) return newA;
    if( newA.e < -(decimals+30) ){
        newA.sign = 0;
        newA.m = 0;
        newA.e = NUMERIC_NAN_EXP;
        newA.approx = 0;
        return newA;
    }
    while( newA.e < -(decimals+1) ){
        newA.m = parseInt((newA.m / 10).toString());
        newA.e++;
    }
    newA.m = parseInt(((newA.m+5)/10).toString());
    newA.e++;
    return numericWillOverflow(newA);
}