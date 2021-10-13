import {TTable} from "./TTable";
import {TColumnDefinition} from "./TColumnDefinition";
import {TTableConstraint} from "../../Table/TTableConstraint";


export interface TQueryCreateTable {
    kind: "TQueryCreateTable",
    name: TTable;
    columns: TColumnDefinition[];
    constraints: TTableConstraint[];

    hasIdentity: boolean;
    identityColumnName: string;
    identitySeed: number;
    identityIncrement: number;
}