import {string_ltrim} from "./string_ltrim";
import {string_rtrim} from "./string_rtrim";


export function string_trim(input: string) {
    if (input === undefined) { return undefined; }
    return string_rtrim(string_ltrim(input));
}