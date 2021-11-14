import {isNumeric} from "../../Numeric/isNumeric";
import {numericDisplay} from "../../Numeric/numericDisplay";
import {numeric} from "../../Numeric/numeric";


export function string_str(input: number | numeric) {
    if (input === undefined) { return undefined; }
    if (isNumeric(input)) {
        return numericDisplay(input);
    }
    if (typeof input === "number") {
        return input.toString();
    }
}