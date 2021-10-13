import {TVariable} from "../Types/TVariable";


export function instanceOfTVariable(object: any): object is TVariable {
    return object !== undefined && object.kind === "TVariable";
}