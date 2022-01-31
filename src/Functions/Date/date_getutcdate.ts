import {TDate} from "../../Query/Types/TDate";
import {TTime} from "../../Query/Types/TTime";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function date_getutcdate(context: TExecutionContext) {
    let now = new Date();
    return {
        kind: "TDateTime",
        date: {
            kind: "TDate",
            year: now.getUTCFullYear(),
            month: now.getUTCMonth() + 1,
            day: now.getUTCDate()
        } as TDate,
        time: {
            kind: "TTime",
            hours: now.getUTCHours(),
            minutes: now.getUTCMinutes(),
            seconds: now.getUTCSeconds(),
            millis: now.getUTCMilliseconds()
        } as TTime
    };
}