import {TQueryExpression} from "../Types/TQueryExpression";


export function instanceOfTQueryExpression(object: any): object is TQueryExpression {
    return object !== undefined && object.kind === "TQueryExpression";
}