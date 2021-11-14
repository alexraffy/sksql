import {numeric} from "./numeric";


export function numericRound(a: numeric, decimals: number) {
    let newA: numeric = {
        sign: a.sign,
        m: a.m,
        e: a.e,
        approx: a.approx
    };
    while (newA.e > decimals) {
        newA.e--;
        newA.m /= 10;
    }
    return newA;
}