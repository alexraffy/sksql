import {TBooleanResult} from "../../API/TBooleanResult";


export function instanceOfTBooleanResult(object: any): object is TBooleanResult {
    return object !== undefined && object.kind === "TBooleanResult";
}