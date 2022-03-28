import {kQueryJoin} from "../Enums/kQueryJoin";
import {TAlias} from "./TAlias";
import {TTable} from "./TTable";
import {TQuerySelect} from "./TQuerySelect";
import {TQueryExpression} from "./TQueryExpression";


export interface TQueryTable {
    kind: "TQueryTable",
    tableName: TAlias | TTable | TQuerySelect;
    joinType: kQueryJoin,
    joinTarget: TAlias;
    joinClauses: TQueryExpression;
}