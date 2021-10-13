import {TQueryComparison} from "../Types/TQueryComparison";


export function instanceOfTQueryComparison(object: any): object is TQueryComparison {
    return object.kind === "TQueryComparison";
}