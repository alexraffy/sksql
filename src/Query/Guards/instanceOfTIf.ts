import {TIf} from "../Types/TIf";


export function instanceOfTIf(object: any): object is TIf {
    return object !== undefined && object.kind === "TIf";
}