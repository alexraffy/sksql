import { TDateCmp } from "../Date/TDateCmp";
import { isNumeric } from "../Numeric/isNumeric";
import { numeric } from "../Numeric/numeric";
import { numericCmp } from "../Numeric/numericCmp";
import { instanceOfTDate } from "../Query/Guards/instanceOfTDate";
import { instanceOfTNumber } from "../Query/Guards/instanceOfTNumber";
import { instanceOfTString } from "../Query/Guards/instanceOfTString";
import { TDate } from "../Query/Types/TDate";
import { TQueryAnyType } from "../Query/Types/TQueryAnyType";



export function compareValues(a: string | number | boolean | bigint | numeric | TDate, b: string | number | boolean | bigint | numeric | TDate) {
    if (typeof a === "string" && typeof b === "string") {
        return a.localeCompare(b);
    }
    if (typeof a === "number" && typeof b === "number") {
        if (a === b) {
            return 0;
        }
        return a - b;
    }
    if (typeof a === "boolean" && typeof b === "boolean") {
        return a === b;
    }
    if (typeof a === "bigint" && typeof b === "bigint") {
        return a === b;
    }

    if (isNumeric(a) && isNumeric(b)) {
        return numericCmp(a, b);
    }

    if (instanceOfTDate(a) && instanceOfTDate(b)) {
        return TDateCmp(a, b);
    }

    throw "Comparison between values " + a  + " and " + b + " not implemented.";

}