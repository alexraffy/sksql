import {parseDateString} from "../../Date/parseDateString";


export function date_isdate(input: string) {
    return parseDateString(input) !== undefined;
}