import {TQueryDropProcedure} from "../Types/TQueryDropProcedure";


export function instanceOfTQueryDropProcedure(object: any): object is TQueryDropProcedure {
    return object !== undefined && object.kind === "TQueryDropProcedure";
}