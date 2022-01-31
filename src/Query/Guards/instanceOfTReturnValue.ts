import {TReturnValue} from "../Types/TReturnValue";


export function instanceOfTReturnValue(object: any): object is TReturnValue {
    return object !== undefined && object.kind === "TReturnValue";
}