

import {TDate} from "../../Query/Types/TDate";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {TDateTime} from "../../Query/Types/TDateTime";


export function date_month(input: TDate | TDateTime) {
    if (input === undefined) { return undefined; }
    if (instanceOfTDateTime(input)) {
        return input.date.month;
    }
    if (instanceOfTDate(input)) {
        return input.month;
    }

}