import {padLeft} from "../../Date/padLeft";
import {TableColumnType} from "../../Table/TableColumnType";



export function string_padLeft(input: string, padWith: string, num: number) {
    if (input === undefined) { return undefined; }
    return padLeft(input, num, padWith)
}