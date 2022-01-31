import {TQueryDropTable} from "../Types/TQueryDropTable";


export function instanceOfTQueryDropTable(object: any): object is TQueryDropTable {
    return object !== undefined && object.kind === "TQueryDropTable";
}