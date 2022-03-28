import { numeric } from "./numeric";
import { numericAdjustExponent } from "./numericAdjustExponent";




export function numericCmp(n1: numeric, n2: numeric): number {
    let {a, b} = numericAdjustExponent(n1, n2);
    let vA = (a.sign === 1) ? 0 - a.m : a.m;
    let vB = (b.sign === 1) ? 0 - b.m : b.m;

    if (vA > vB) {
        return 1;
    }
    if (vA < vB) {
        return -1;
    }
    return 0;
}