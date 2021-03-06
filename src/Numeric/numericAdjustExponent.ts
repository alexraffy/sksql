import {numeric, NUMERIC_MAX} from "./numeric";
import {TParserError} from "../API/TParserError";
import {isNumeric} from "./isNumeric";

/*
    adjust two numeric so they have the same exponent
 */
export function numericAdjustExponent(a: numeric, b: numeric): {a: numeric, b: numeric} {
    if (!isNumeric(a) || !isNumeric(b)) {
        throw new TParserError("numericAdjustExponent expects two numerics.");
    }
    let swapped = false;
    let newA: numeric = {
        sign: a.sign,
        m: a.m,
        e: a.e,
        approx: a.approx
    };
    let newB: numeric = {
        sign: b.sign,
        m: b.m,
        e: b.e,
        approx: b.approx
    };
    if (newA.e < newB.e) {
        let t: numeric = {
            m: newA.m,
            e: newA.e,
            sign: newA.sign,
            approx: newA.approx
        };
        newA = newB;
        newB = t;
        swapped = true;
    }
    if (newB.m === 0) {
        newB.e = newA.e;
        return {
            a: (swapped) ? newB : newA,
            b: (swapped) ? newA : newB
        };
    }
    if (newA.m === 0) {
        newA.e = newB.e;
        return {
            a: (swapped) ? newB : newA,
            b: (swapped) ? newA : newB
        };
    }
    if (newA.e > newB.e + 40) {
        newB.approx = 1;
        newB.m = 0;
        return {
            a: (swapped) ? newB : newA,
            b: (swapped) ? newA : newB
        };
    }

    while (newA.e !== newB.e) {
        if (newA.e > newB.e) {
            newA.m *= 10;
            newA.e--;
        } else if (newA.e < newB.e) {
            newB.m *= 10;
            newB.e--;
        }
    }

    while (newA.e < newB.e && newB.m % 10 === 0) {
        newB.m *= 10;
        newB.e--;
    }
    while (newA.e < newB.e && newA.m <= NUMERIC_MAX) {
        newB.m *= 10;
        newB.e--;
    }
    while (newA.e < newB.e) {
        newB.m *= 10;
        newB.e--;
        newB.approx = 1;
    }
    return {
        a: (swapped) ? newB : newA,
        b: (swapped) ? newA : newB
    };
}