import {TTime} from "../Query/Types/TTime";


export function TTimeCmp(a: TTime, b: TTime) {
    if (a.hours > b.hours) {
        return 1;
    }
    if (a.hours < b.hours) {
        return -1;
    }
    if (a.minutes > b.minutes) {
        return 1;
    }
    if (a.minutes < b.minutes) {
        return -1;
    }
    if (a.seconds > b.seconds) {
        return 1;
    }
    if (a.seconds < b.seconds) {
        return -1
    }
    if (a.millis > b.millis) {
        return 1;
    }
    if (a.millis < b.millis) {
        return -1;
    }
    return 0;
}