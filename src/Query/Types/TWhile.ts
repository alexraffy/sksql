import {TQueryComparisonExpression} from "./TQueryComparisonExpression";
import {TQueryComparison} from "./TQueryComparison";
import {TVariableAssignment} from "./TVariableAssignment";
import {TReturnValue} from "./TReturnValue";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TBeginEnd} from "./TBeginEnd";
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";


export interface TWhile {
    kind: "TWhile",
    test: TQueryComparisonExpression | TQueryComparison;
    op: TValidStatementsInFunction[];
}