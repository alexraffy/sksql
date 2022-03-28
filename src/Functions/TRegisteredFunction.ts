import {kFunctionType} from "./kFunctionType";
import {TableColumnType} from "../Table/TableColumnType";
import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";


export interface TRegisteredFunction {
    type: kFunctionType,
    name: string,
    parameters: {name: string, type: TableColumnType}[],
    returnType: TableColumnType,
    fn: ((...args) => any) | TQueryCreateFunction;
    hasVariableParams: boolean;
    returnTypeSameTypeHasParameterX?: number;
}