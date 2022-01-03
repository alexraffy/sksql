import {TDateCmp} from "./TDateCmp";
import {TTimeCmp} from "./TTimeCmp";
import {TDateTime} from "../Query/Types/TDateTime";


export function TDateTimeCmp(a: TDateTime, b: TDateTime) {
    let tdate = TDateCmp(a.date, b.date);
    if (tdate !== 0) { return tdate;}
    return TTimeCmp(a.time, b.time);

}