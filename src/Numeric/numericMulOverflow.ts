import {numeric, NUMERIC_MAX} from "./numeric";

// reduce a numeric value until it stops from overflowing

export function numericWillOverflow(x: numeric): numeric {

    while (x.m > (NUMERIC_MAX)) {
        x.m = parseInt((x.m / 10).toString());
        x.e++;
    }
    return x;
}