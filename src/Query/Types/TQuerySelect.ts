import {kCommandType} from "../Enums/kCommandType";
import {TQueryTable} from "./TQueryTable";
import {TQueryColumn} from "./TQueryColumn";
import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TNumber} from "./TNumber";
import {TQueryOrderBy} from "./TQueryOrderBy";
import {TQueryComparisonColumnEqualsString} from "./TQueryComparisonColumnEqualsString";
import {TValidExpressions} from "./TValidExpressions";


export interface TQuerySelect {
    kind: "TQuerySelect";
    command: kCommandType;
    top?: TQueryExpression | TQueryFunctionCall | TVariable | TNumber;
    tables: TQueryTable[];
    columns: TQueryColumn[];
    where: TQueryExpression | TValidExpressions;
    groupBy: TQueryOrderBy[];
    having: TQueryExpression | TValidExpressions;
    orderBy: TQueryOrderBy[];
    resultTableName: string;
    hasForeignColumns: boolean;
}