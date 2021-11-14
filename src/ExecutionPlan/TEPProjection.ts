import {TableColumn} from "../Table/TableColumn";
import {TQueryColumn} from "../Query/Types/TQueryColumn";


export interface TEPProjection {
    columnName: string,
    output: TQueryColumn
}