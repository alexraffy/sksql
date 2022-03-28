import {TAlias} from "../Types/TAlias";


export function instanceOfTAlias(object: any): object is TAlias {
    return object !== undefined && object.kind === "TAlias";
}