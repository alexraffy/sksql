import {TCaseWhen} from "../Types/TCaseWhen";


export function instanceOfTCaseWhen(object: any): object is TCaseWhen {
    return object !== undefined && object.kind === "TCaseWhen";
}