import {TQueryUpdate} from "../Types/TQueryUpdate";


export function instanceOfTQueryUpdate(object: any): object is TQueryUpdate {
    return object !== undefined && object.kind === "TQueryUpdate";
}