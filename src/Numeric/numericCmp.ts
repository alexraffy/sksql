import { numeric } from "./numeric";
import { numericAdjustExponent } from "./numericAdjustExponent";




export function numericCmp(n1: numeric, n2: numeric): number {
    let {a, b} = numericAdjustExponent(n1, n2);
    if (a.m > b.m) {
        return 1;
    }
    if (a.m < b.m) {
        return -1;
    }
    return 0;
}