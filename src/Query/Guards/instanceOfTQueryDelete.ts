import {TQueryDelete} from "../Types/TQueryDelete";


export function instanceOfTQueryDelete(object: any): object is TQueryDelete {
    return object !== undefined && object.kind === "TQueryDelete";
}