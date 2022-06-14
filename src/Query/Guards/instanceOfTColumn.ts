import {TColumn} from "../Types/TColumn";


export function instanceOfTColumn(object: any): object is TColumn {
    return object !== undefined && object.kind === "TColumn";
}