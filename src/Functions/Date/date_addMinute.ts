import {date_addMillisecond} from "./date_addMillisecond";

// add value number of minutes to a Javascript Date
export function date_addMinute(d: Date, value: number) {
    return date_addMillisecond(d, value * 60000);
}