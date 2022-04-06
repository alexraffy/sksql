import {kFunctionType} from "./kFunctionType";
import {TableColumnType} from "../Table/TableColumnType";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";

// Struct to store info about a SQL function

export interface TRegisteredFunction {
    type: kFunctionType,
    name: string,
    parameters: {name: string, type: TableColumnType}[],
    returnType: TableColumnType,
    fn: ((...args) => any) | TQueryCreateFunction;
    hasVariableParams: boolean;
    returnTypeSameTypeHasParameterX?: number;
}