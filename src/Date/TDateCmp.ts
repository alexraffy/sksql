import {TDate} from "../Query/Types/TDate";


export function TDateCmp(a: TDate, b: TDate) {

    if (a.year > b.year) {
        return 1;
    }
    if (a.year < b.year) {
        return -1;
    }
    if (a.month > b.month) {
        return 1;
    }
    if (a.month < b.month) {
        return -1;
    }
    if (a.day > b.day) {
        return 1;
    }
    if (a.day < b.day) {
        return -1;
    }
    return 0;

}