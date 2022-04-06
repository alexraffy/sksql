import {date_addMillisecond} from "./date_addMillisecond";

// add value number of seconds to a Javascript Date
export function date_addSecond(d: Date, value: number) {
    return date_addMillisecond(d, value * 1000);
}