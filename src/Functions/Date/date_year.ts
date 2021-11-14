


import {TDate} from "../../Query/Types/TDate";


export function date_year(input: TDate) {
    if (input === undefined) { return undefined; }
    return input.year;
}