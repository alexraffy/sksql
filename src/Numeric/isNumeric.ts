import {numeric} from "./numeric";


export function isNumeric(object: any): object is numeric {
    return object !== undefined && object.sign !== undefined && object.m !== undefined !== object.e !== undefined;
}