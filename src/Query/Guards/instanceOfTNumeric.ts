import {TNumeric} from "../Types/TNumeric";


export function instanceOfTNumeric(object: any): object is TNumeric {
    return object !== undefined && object.kind === "TNumeric"
}