import {TableColumn} from "./TableColumn";
import {TTableConstraint} from "./TTableConstraint";

/*
    Definition of the table
    id: internal id of the table
    name: public name of the table
    columns: columns definition and buffer offsets are in this array
    constraints: array of constraints on the table
    hasIdentity: if a column in the table is an identity
    identitySeed: initial value for the identity column
    identityIncrement: integer by which to increment the identity
    identityValue?: value containing the last identity
 */
export interface ITableDefinition {
    id: number;
    object_id: string;
    name: string;
    columns: TableColumn[];
    constraints: TTableConstraint[];

    hasIdentity: boolean;
    identityColumnName: string;
    identitySeed: number;
    identityIncrement: number;

    identityValue?: number;
}

export interface ITableDefinitionV0 {
    id: number;
    name: string;
    columns: TableColumn[];
    constraints: TTableConstraint[];

    hasIdentity: boolean;
    identityColumnName: string;
    identitySeed: number;
    identityIncrement: number;

    identityValue?: number;
}