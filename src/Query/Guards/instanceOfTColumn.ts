import {TColumn} from "../Types/TColumn";


export function instanceOfTColumn(object: any): object is TColumn {
    return object.kind === "TColumn";
}