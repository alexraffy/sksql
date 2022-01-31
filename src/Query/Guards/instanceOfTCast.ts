import {TCast} from "../Types/TCast";


export function instanceOfTCast(object: any): object is TCast {
    return object !== undefined && object.kind === "TCast";
}