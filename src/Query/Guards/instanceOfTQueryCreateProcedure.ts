import {TQueryCreateProcedure} from "../Types/TQueryCreateProcedure";


export function instanceOfTQueryCreateProcedure(object: any): object is TQueryCreateProcedure {
    return object !== undefined && object.kind === "TQueryCreateProcedure";
}