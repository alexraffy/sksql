import {TVariable} from "./TVariable";
import {TColumnType} from "./TColumnType";
import {TVariableAssignment} from "./TVariableAssignment";
import {TVariableDeclaration} from "./TVariableDeclaration";
import {TReturnValue} from "./TReturnValue";
import {TValidStatementsInFunction} from "./TValidStatementsInFunction";


export interface TQueryCreateFunction {
    kind: "TQueryCreateFunction";
    functionName: string;
    parameters: { variableName: TVariable, type: TColumnType }[];
    returnType: TColumnType;
    ops: (TValidStatementsInFunction)[];
}