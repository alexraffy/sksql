


import {TDate} from "../../Query/Types/TDate";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {TDateTime} from "../../Query/Types/TDateTime";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function date_year(context: TExecutionContext, input: TDate | TDateTime) {
    if (input === undefined) { return undefined; }
    if (instanceOfTDateTime(input)) {
        return input.date.year;
    }
    if (instanceOfTDate(input)) {
        return input.year;
    }
}