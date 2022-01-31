import {TQueryDropFunction} from "../Types/TQueryDropFunction";


export function instanceOfTQueryDropFunction(object: any): object is TQueryDropFunction {
    return object !== undefined && object.kind === "TQueryDropFunction";
}