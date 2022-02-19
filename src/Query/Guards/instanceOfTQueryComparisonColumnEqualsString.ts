import {TQueryComparisonColumnEqualsString} from "../Types/TQueryComparisonColumnEqualsString";


export function instanceOfTQueryComparisonColumnEqualsString(object: any): object is TQueryComparisonColumnEqualsString {
    return object !== undefined && object.kind === "TQueryComparisonColumnEqualsString";
}