import {TBoolValue} from "../Types/TBoolValue";


export function instanceOfTBoolValue(object: any): object is TBoolValue {
    return object !== undefined && object.kind === "TBoolValue" && (object.value === true || object.value === false);
}