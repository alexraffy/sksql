import {TVariableAssignment} from "../Types/TVariableAssignment";


export function instanceOfTVariableAssignment(object: any): object is TVariableAssignment {
    return object !== undefined && object.kind === "TVariableAssignment";
}