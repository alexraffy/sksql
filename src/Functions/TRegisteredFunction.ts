import {kFunctionType} from "./kFunctionType";
import {TableColumnType} from "../Table/TableColumnType";


export interface TRegisteredFunction {
    type: kFunctionType,
    name: string,
    parameters: {name: string, type: TableColumnType}[],
    returnType: TableColumnType,
    fn: (...args) => any
}