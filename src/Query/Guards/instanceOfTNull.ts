import {TNull} from "../Types/TNull";


export function instanceOfTNull(object: any): object is TNull {
    return object !== undefined && object.kind === "TNull";
}