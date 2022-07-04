import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {TDateTime} from "../../Query/Types/TDateTime";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {TDate} from "../../Query/Types/TDate";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {TTime} from "../../Query/Types/TTime";
import {date_addMillisecond} from "./date_addMillisecond";
import {date_addSecond} from "./date_addSecond";
import {date_addMinute} from "./date_addMinute";
import {date_addHour} from "./date_addHour";
import {date_addDay} from "./date_addDay";
import {date_addMonth} from "./date_addMonth";
import {date_addYear} from "./date_addYear";
import {date_addQuarter} from "./date_addQuarter";
import {date_addWeek} from "./date_addWeek";
import {date_addWeekDay} from "./date_addWeekDay";
import {TParserError} from "../../API/TParserError";



// SQL Function DATEADD


export function date_dateadd(context: TExecutionContext, what: string, value: number, fromDate: TDateTime | TDate) {
    let d: Date;
    if (instanceOfTDateTime(fromDate)) {
        d = new Date(fromDate.date.year, fromDate.date.month -1, fromDate.date.day, fromDate.time.hours, fromDate.time.minutes, fromDate.time.seconds, fromDate.time.millis);
    }
    if (instanceOfTDate(fromDate)) {
        d = new Date(fromDate.year, fromDate.month - 1, fromDate.day);
    }

    let ret: Date;

    switch (what) {
        case "millisecond":
        case "ms":
            ret = date_addMillisecond(d, value);
        case "second":
        case "ss":
        case "s":
            ret = date_addSecond(d, value);
            break;
        case "minute":
        case "mi":
        case "n":
            ret = date_addMinute(d, value);
            break;
        case "hour":
        case "hh":
            ret = date_addHour(d, value);
            break;
        case "day":
        case "dd":
        case "d":
            ret = date_addDay(d, value);
            break;
        case "month":
        case "mm":
        case "m":
            ret = date_addMonth(d, value);
            break;
        case "year":
        case "yyyy":
        case "yy":
            ret = date_addYear(d, value);
            break;
        case "quarter":
        case "qq":
        case "q":
            ret = date_addQuarter(d, value);
            break;
        case "dayofyear":
        case "dy":
        case "y":
            break;
        case "week":
        case "wk":
        case "ww":
            ret = date_addWeek(d, value);
            break;
        case "weekday":
        case "dw":
        case "w":
            ret = date_addWeekDay(d, value);
            break;
        default:
        {
            throw new TParserError(what + " is not a valid parameter for DATEADD")
        }
    }


    return {
        kind: "TDateTime",
        date: {
            kind: "TDate",
            year: ret.getFullYear(),
            month: ret.getMonth() + 1,
            day: ret.getDate()
        } as TDate,
        time: {
            kind: "TTime",
            hours: ret.getHours(),
            minutes: ret.getMinutes(),
            seconds: ret.getSeconds(),
            millis: ret.getMilliseconds()
        } as TTime
    };

}