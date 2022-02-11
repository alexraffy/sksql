import {date_addMonth} from "./date_addMonth";


export function date_addQuarter(d: Date, value: number) {
    return date_addMonth(d, Math.floor(value) * 3);
}