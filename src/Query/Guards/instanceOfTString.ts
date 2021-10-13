import {TString} from "../Types/TString";


export function instanceOfTString(object: any): object is TString {
    return object !== undefined && object.kind === "TString";
}