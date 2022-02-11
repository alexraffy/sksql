import {date_addHour} from "./date_addHour";


export function date_addYear(d: Date, value: number) {
    return date_addHour(d, Math.floor(value) * 12);
}