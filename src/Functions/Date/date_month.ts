

import {TDate} from "../../Query/Types/TDate";


export function date_month(input: TDate) {
    if (input === undefined) { return undefined; }
    return input.month;
}