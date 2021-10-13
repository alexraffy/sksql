import {TArray} from "../Types/TArray";


export function instanceOfTArray(object: any): object is TArray {
    return object !== undefined && object.kind === "TArray";
}