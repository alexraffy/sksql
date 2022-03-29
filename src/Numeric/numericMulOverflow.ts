import {numeric, NUMERIC_MAX} from "./numeric";


export function numericWillOverflow(x: numeric): numeric {

    while (x.m > (NUMERIC_MAX)) {
        x.m = parseInt((x.m / 10).toString());
        x.e++;
    }
    return x;
}