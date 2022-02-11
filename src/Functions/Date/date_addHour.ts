import {date_addMillisecond} from "./date_addMillisecond";
import {date_addMinute} from "./date_addMinute";


export function date_addHour(d: Date, value: number) {
    return date_addMinute(d, value * 60);
}