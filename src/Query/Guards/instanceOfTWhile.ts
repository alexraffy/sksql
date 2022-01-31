import {TWhile} from "../Types/TWhile";


export function instanceOfTWhile(object: any): object is TWhile {
    return object !== undefined && object.kind === "TWhile";
}