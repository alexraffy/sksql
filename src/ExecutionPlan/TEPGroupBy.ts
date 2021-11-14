import {TQueryOrderBy} from "../Query/Types/TQueryOrderBy";
import {TEP} from "./TEP";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {TAlias} from "../Query/Types/TAlias";
import {TTable} from "../Query/Types/TTable";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {TEPProjection} from "./TEPProjection";


export interface TEPGroupBy extends TEP {
    kind: "TEPGroupBy";
    source: TAlias | TTable;
    dest: TAlias | TTable;
    groupBy: TQueryOrderBy[];
    having: TQueryComparisonExpression | TQueryComparison;
    output: TQueryColumn[];
    projections: TEPProjection[];
}