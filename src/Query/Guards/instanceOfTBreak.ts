import {TBreak} from "../Types/TBreak";


export function instanceOfTBreak(object: any): object is TBreak {
    return object !== undefined && object.kind === "TBreak";
}