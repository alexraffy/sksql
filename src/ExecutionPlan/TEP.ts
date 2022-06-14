import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TQueryInsert} from "../Query/Types/TQueryInsert";
import {TQueryDelete} from "../Query/Types/TQueryDelete";

export interface TExecutionPlan {
    kind: "TExecutionPlan";
    steps: TEP[];
    hasForeignTables: boolean;
    tablesReferences: string[];
    tempTables: string[];
    statement: TQuerySelect | TQueryUpdate | TQueryInsert | TQueryDelete;
}


// base struct for an execution plan stage
export interface TEP {
    kind: string;
}