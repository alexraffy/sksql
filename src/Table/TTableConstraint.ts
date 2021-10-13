import {kTableConstraintType} from "./kTableConstraintType";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {kForeignKeyOnEvent} from "./kForeignKeyOnEvent";

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
    check: TQueryComparisonExpression | TQueryComparison;


}