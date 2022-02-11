import {date_addDay} from "./date_addDay";


export function date_addWeek(d: Date, value: number) {
    return date_addDay(d, Math.floor(value) * 7);
}