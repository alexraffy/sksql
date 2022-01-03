import {TTime} from "../Types/TTime";


export function instanceOfTTime(object: any): object is TTime {
    return object !== undefined && object.kind === "TTime";
}