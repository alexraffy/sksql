import {TColumnDefinition} from "../Types/TColumnDefinition";


export function instanceOfTColumnDefinition(object: any): object is TColumnDefinition {
    return object !== undefined && object.kind === "TColumnDefinition";
}