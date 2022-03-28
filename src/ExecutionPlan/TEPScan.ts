import {TEP} from "./TEP";
import {TEPRange} from "./TEPRange";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {TAlias} from "../Query/Types/TAlias";
import {TTable} from "../Query/Types/TTable";
import {TEPProjection} from "./TEPProjection";
import {TQuerySelect} from "../Query/Types/TQuerySelect";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TValidExpressions} from "../Query/Types/TValidExpressions";


export interface TEPScan extends TEP {
    kind: "TEPScan";
    table: TAlias | TTable;
    predicate: TQueryExpression | TValidExpressions;
    range?: TEPRange;
    projection: TEPProjection[];
    result: string;
}