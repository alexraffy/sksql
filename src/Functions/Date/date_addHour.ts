import {date_addMillisecond} from "./date_addMillisecond";
import {date_addMinute} from "./date_addMinute";

// add value number of hours to a Javascript Date
export function date_addHour(d: Date, value: number) {
    return date_addMinute(d, value * 60);
}