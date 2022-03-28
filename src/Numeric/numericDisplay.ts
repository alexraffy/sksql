import {numeric, NUMERIC_MAX_EXP} from "./numeric";

/*
    returns a string representation of the numeric if its possible or NaN or Infinity
 */
export function numericDisplay(num: numeric) {
    let strArray: string[] = [];

    if ( num.e > NUMERIC_MAX_EXP ) {
        if (num.m === 0) {
            return "NaN";
        } else {
            return "Infinity";
        }
    }
    if (num.m === 0) {
        return "0";
    }
    strArray = num.m.toString().split("");
    while (strArray.length < Math.abs(num.e)) {
        strArray.unshift("0");
    }
    if (Math.abs(num.e) > 0) {
        strArray.splice((strArray.length) - Math.abs(num.e), 0, ".");
    }


    while (strArray.length > 1 && strArray[0] === "0") {
        strArray.shift()
    }
    if (strArray[0] === ".") {
        strArray.unshift("0");
    }

    if (num.sign === 1 && num.m > 0) {
        strArray.unshift("-");
    }

    return strArray.join("");
}
