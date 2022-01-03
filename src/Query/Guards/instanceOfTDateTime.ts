import {TDateTime} from "../Types/TDateTime";


export function instanceOfTDateTime(object: any): object is TDateTime {
    return object !== undefined && object.kind === "TDateTime";
}