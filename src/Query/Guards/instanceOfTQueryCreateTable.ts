import {TQueryCreateTable} from "../Types/TQueryCreateTable";


export function instanceOfTQueryCreateTable(object: any): object is TQueryCreateTable {
    return object !== undefined && object.kind === "TQueryCreateTable";
}