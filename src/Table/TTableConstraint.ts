import {kTableConstraintType} from "./kTableConstraintType";
import {kForeignKeyOnEvent} from "./kForeignKeyOnEvent";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TValidExpressions} from "../Query/Types/TValidExpressions";

/*
    Constraint information

 */
export interface TTableConstraint {
    constraintName: string;
    type: kTableConstraintType;
    clustered: boolean;
    columns: {
        name: string;
        ascending: boolean;
    }[]
    foreignKeyTable: string;
    foreignKeyColumnsRef: string[];
    foreignKeyOnUpdate: kForeignKeyOnEvent;
    foreignKeyOnDelete: kForeignKeyOnEvent;
    check: TQueryExpression | TValidExpressions;


}