import {TVariable} from "./TVariable";
import {TColumnType} from "./TColumnType";
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";
import {TQueryExpression} from "./TQueryExpression";
import {TValidExpressions} from "./TValidExpressions";


export interface TQueryCreateProcedure {
    kind: "TQueryCreateProcedure";
    procName: string;
    parameters: { variableName: TVariable, type: TColumnType, defaultValue?: TValidExpressions, output: boolean }[];
    ops: (TValidStatementsInFunction)[];
}