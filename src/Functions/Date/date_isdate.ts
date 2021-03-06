import {parseDateString} from "../../Date/parseDateString";
import {parseDateTimeString} from "../../Date/parseDateTimeString";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function ISDATE
// Return TRUE if the string is parseable as a DATE or DATETIME
export function date_isdate(context: TExecutionContext, input: string) {
    let dt = parseDateTimeString(input);
    if (instanceOfTDateTime(dt)) { return true;}
    return instanceOfTDate(parseDateString(input));
}