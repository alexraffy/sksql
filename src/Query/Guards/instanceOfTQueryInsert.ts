import {TQueryInsert} from "../Types/TQueryInsert";


export function instanceOfTQueryInsert(object: any): object is TQueryInsert {
    return object !== undefined && object.kind === "TQueryInsert";
}