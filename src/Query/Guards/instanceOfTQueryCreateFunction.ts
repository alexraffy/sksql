import {TQueryCreateFunction} from "../Types/TQueryCreateFunction";


export function instanceOfTQueryCreateFunction(object: any): object is TQueryCreateFunction {
    return object !== undefined && object.kind === "TQueryCreateFunction";
}