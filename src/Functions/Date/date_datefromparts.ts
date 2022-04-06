import {TDate} from "../../Query/Types/TDate";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";

// SQL function DATEFROMPARTS
// Return a DATE from the specified year, month and day
export function date_datefromparts(context: TExecutionContext, y: number, m: number, d: number) {
    return {
        kind: "TDate",
        year: y,
        month: m,
        day: d
    } as TDate
}