import {TDate} from "../../Query/Types/TDate";


export function date_day(input: TDate) {
    if (input === undefined) { return undefined; }
    return input.day;
}