import {date_addMillisecond} from "./date_addMillisecond";


export function date_addMinute(d: Date, value: number) {
    return date_addMillisecond(d, value * 60000);
}