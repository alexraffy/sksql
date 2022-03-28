import { numeric } from "./numeric";
import { numericDisplay } from "./numericDisplay";



export function numericToNumber(n: numeric) {
    if (n.e < 0) {
        return parseFloat(numericDisplay(n));
    } else {
        return parseInt(numericDisplay(n));
    }
}