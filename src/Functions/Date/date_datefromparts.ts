import {TDate} from "../../Query/Types/TDate";


export function date_datefromparts(y: number, m: number, d: number) {
    return {
        kind: "TDate",
        year: y,
        month: m,
        day: d
    } as TDate
}