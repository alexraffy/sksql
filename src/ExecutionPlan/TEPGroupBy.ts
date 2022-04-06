import {TQueryOrderBy} from "../Query/Types/TQueryOrderBy";
import {TEP} from "./TEP";
import {TQueryColumn} from "../Query/Types/TQueryColumn";
import {TAlias} from "../Query/Types/TAlias";
import {TTable} from "../Query/Types/TTable";
import {TEPProjection} from "./TEPProjection";
import {TRegisteredFunction} from "../Functions/TRegisteredFunction";
import {TQueryFunctionCall} from "../Query/Types/TQueryFunctionCall";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TValidExpressions} from "../Query/Types/TValidExpressions";


// Group by stage
//

export interface TEPGroupBy extends TEP {
    kind: "TEPGroupBy";
    source: TAlias | TTable;
    dest: TAlias | TTable;
    groupBy: TQueryOrderBy[];
    having: TQueryExpression | TValidExpressions;
    output: TQueryColumn[];
    projections: TEPProjection[];
    aggregateFunctions: {name: string, fn: TRegisteredFunction, funcCall: TQueryFunctionCall, data: any}[];
}