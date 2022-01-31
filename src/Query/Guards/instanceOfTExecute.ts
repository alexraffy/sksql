import {TExecute} from "../Types/TExecute";


export function instanceOfTExecute(object: any): object is TExecute {
    return object !== undefined && object.kind === "TExecute";
}