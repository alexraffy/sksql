import {TQueryComparisonExpression} from "./TQueryComparisonExpression";
import {TVariableDeclaration} from "./TVariableDeclaration";
import {TReturnValue} from "./TReturnValue";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TBeginEnd} from "./TBeginEnd";
import {TQueryComparison} from "./TQueryComparison";
import {TVariableAssignment} from "./TVariableAssignment";
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";


export interface TIf {
    kind: "TIf",
    tests: {
        test: TQueryComparisonExpression | TQueryComparison;
        op: TValidStatementsInFunction[];
    }[];
}