import {numeric} from "./numeric";


export function numericWillOverflow(x: numeric): numeric {

    while (x.m > (2147483647/10)) {
        x.m = parseInt((x.m / 10).toString());
        x.e++;
    }
    return x;
}