import {TQueryColumn} from "../Types/TQueryColumn";


export function instanceOfTQueryColumn(object: any): object is TQueryColumn {
    return object !== undefined && object.kind === "TQueryColumn";
}