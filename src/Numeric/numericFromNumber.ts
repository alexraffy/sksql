import {numeric} from "./numeric";

/*
    returns a numeric from a number
 */
export function numericFromNumber(a: number): numeric {
    let m = a;
    let e = 0;
    let str = a.toString();
    let idx = str.indexOf(".");
    if ( idx > -1) {
        m =  parseInt(str.replace(".", ""));
        e = Math.abs(str.length - idx);
    }
    let ret = {
        sign: (a < 0) ? 1 : 0,
        m : m,
        e: e,
        approx: 0
    } as numeric;

    return ret;
}