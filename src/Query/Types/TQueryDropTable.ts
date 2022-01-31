import {TTable} from "./TTable";


export interface TQueryDropTable {
    kind: "TQueryDropTable";
    table: TTable;
}