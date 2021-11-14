import {TDate} from "../../Query/Types/TDate";


export function date_getutcdate() {
    let now = new Date();
    return {
        kind: "TDate",
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate()
    } as TDate
}