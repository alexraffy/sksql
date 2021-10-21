import {kQueryJoin} from "../Enums/kQueryJoin";
import {TAlias} from "./TAlias";
import {TQueryComparisonExpression} from "./TQueryComparisonExpression";
import {TQueryComparison} from "./TQueryComparison";
import {TTable} from "./TTable";


export interface TQueryTable {
    kind: "TQueryTable",
    tableName: TAlias | TTable;
    joinType: kQueryJoin,
    joinTarget: TAlias;
    joinClauses: TQueryComparisonExpression | TQueryComparison;
}