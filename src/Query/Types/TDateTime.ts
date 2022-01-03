import {TDate} from "./TDate";
import {TTime} from "./TTime";


export interface TDateTime {
    kind: "TDateTime",
    date: TDate;
    time: TTime;
}