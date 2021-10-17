import {numericLoad, numericAdd, numericDisplay} from "sksql";
import * as assert from "assert";

export function test_numeric() {
    let num1 = numericLoad("150.15");
    let num2 = numericLoad("0.2");
    let num3 = numericAdd(num1, num2);
    assert(numericDisplay(num3) === "150.35", "Adding two numeric is broken.");
}