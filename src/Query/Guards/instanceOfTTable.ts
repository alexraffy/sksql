import {TTable} from "../Types/TTable";


export function instanceOfTTable(object: any): object is TTable {
    return object !== undefined && object.kind === "TTable";
}