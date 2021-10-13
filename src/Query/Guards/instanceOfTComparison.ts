import {TComparison} from "../Types/TComparison";


export function instanceOfTComparison(object: any): object is TComparison {
    return object !== undefined && object.kind === "TComparison";
}