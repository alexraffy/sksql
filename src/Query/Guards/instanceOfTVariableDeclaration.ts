import {TVariableDeclaration} from "../Types/TVariableDeclaration";


export function instanceOfTVariableDeclaration(object: any): object is TVariableDeclaration {
    return object !== undefined && object.kind === "TVariableDeclaration";
}