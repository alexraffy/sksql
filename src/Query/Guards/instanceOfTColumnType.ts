import {TColumnType} from "../Types/TColumnType";


export function instanceOfTColumnType(object: any): object is TColumnType {
    return object !== undefined && object.kind === "TColumnType";
}