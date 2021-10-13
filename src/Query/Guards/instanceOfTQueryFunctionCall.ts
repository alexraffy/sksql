import {TQueryFunctionCall} from "../Types/TQueryFunctionCall";

export function instanceOfTQueryFunctionCall(object: any): object is TQueryFunctionCall {
    return object !== undefined && object.kind === "TQueryFunctionCall";
}