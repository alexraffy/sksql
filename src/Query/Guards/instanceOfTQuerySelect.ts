import {TQuerySelect} from "../Types/TQuerySelect";


export function instanceOfTQuerySelect(object: any): object is TQuerySelect {
    return object !== undefined && object.kind === "TQuerySelect";
}