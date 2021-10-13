import {kQueryJoin} from "../Enums/kQueryJoin";
import {TAlias} from "./TAlias";


export interface TQueryTable {
    kind: "TQueryTable",
    tableName: TAlias;
    joinType: kQueryJoin,
    joinTarget: TAlias;
    joinClauses: string[];
}