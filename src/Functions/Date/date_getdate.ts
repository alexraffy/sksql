import {TDate} from "../../Query/Types/TDate";


export function date_getdate() {
    let now = new Date();
    return {
        kind: "TDate",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate()
    } as TDate
}