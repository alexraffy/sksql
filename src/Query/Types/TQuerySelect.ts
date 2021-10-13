import {kCommandType} from "../Enums/kCommandType";
import {TQueryTable} from "./TQueryTable";
import {TQueryColumn} from "./TQueryColumn";
import {TQueryComparison} from "./TQueryComparison";
import {TQueryComparisonExpression} from "./TQueryComparisonExpression";
import {TLiteral} from "./TLiteral";
import {kOrder} from "../Enums/kOrder";
import {TColumn} from "./TColumn";
import {TQueryExpression} from "./TQueryExpression";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TNumber} from "./TNumber";
import {TQueryOrderBy} from "./TQueryOrderBy";


export interface TQuerySelect {
    kind: "TQuerySelect";
    command: kCommandType,
    top?: TQueryExpression | TQueryFunctionCall | TVariable | TNumber;
    tables: TQueryTable[],
    columns: TQueryColumn[],
    where: TQueryComparisonExpression | TQueryComparison;
    orderBy: TQueryOrderBy[]
}