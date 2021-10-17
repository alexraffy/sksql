import {TDate} from "../Types/TDate";


export function instanceOfTDate(object: any): object is TDate {
    return object !== undefined && object.kind === "TDate";
}