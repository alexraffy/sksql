import {TQueryTable} from "../Types/TQueryTable";


export function instanceOfTQueryTable(object: any): object is TQueryTable {
    return object !== undefined && object.kind === "TQueryTable";
}