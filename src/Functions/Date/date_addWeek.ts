import {date_addDay} from "./date_addDay";

// add value number of weeks to a Javascript Date
export function date_addWeek(d: Date, value: number) {
    return date_addDay(d, Math.floor(value) * 7);
}