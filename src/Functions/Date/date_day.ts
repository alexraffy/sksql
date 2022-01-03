import {TDate} from "../../Query/Types/TDate";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {TDateTime} from "../../Query/Types/TDateTime";


export function date_day(input: TDate | TDateTime) {
    if (input === undefined) { return undefined; }
    if (instanceOfTDateTime(input)) {
        return input.date.day;
    }
    if (instanceOfTDate(input)) {
        return input.day;
    }
}