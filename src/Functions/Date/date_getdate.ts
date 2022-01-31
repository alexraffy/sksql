import {TDate} from "../../Query/Types/TDate";
import {TTime} from "../../Query/Types/TTime";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function date_getdate(context: TExecutionContext) {
    let now = new Date();
    return {
        kind: "TDateTime",
        date: {
            kind: "TDate",
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate()
        } as TDate,
        time: {
            kind: "TTime",
            hours: now.getHours(),
            minutes: now.getMinutes(),
            seconds: now.getSeconds(),
            millis: now.getMilliseconds()
        } as TTime
    };
}