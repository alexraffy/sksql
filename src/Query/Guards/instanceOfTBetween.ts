import {TBetween} from "../Types/TBetween";


export function instanceOfTBetween(object: any): object is TBetween {
    return object.kind === "TBetween";
}