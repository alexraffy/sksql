import {TNumber} from "../Types/TNumber";


export function instanceOfTNumber(object: any): object is TNumber {
    return object !== undefined && object.kind === "TNumber";
}