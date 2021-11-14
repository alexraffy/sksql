import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {TEP} from "./TEP";
import {TEPRange} from "./TEPRange";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {TAlias} from "../Query/Types/TAlias";
import {TTable} from "../Query/Types/TTable";
import {TEPProjection} from "./TEPProjection";


export interface TEPScan extends TEP {
    kind: "TEPScan";
    table: TAlias | TTable;
    predicate: TQueryComparisonExpression | TQueryComparison;
    range?: TEPRange;
    projection: TEPProjection[];
    result: string;
}