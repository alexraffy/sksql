import {TQueryExpression} from "./TQueryExpression";
import {TQueryComparisonExpression} from "./TQueryComparisonExpression";
import {TQueryComparison} from "./TQueryComparison";
import {TQueryColumn} from "./TQueryColumn";
import {TBoolValue} from "./TBoolValue";
import {TString} from "./TString";
import {TNumber} from "./TNumber";
import {TQuerySelect} from "./TQuerySelect";
import {TColumn} from "./TColumn";
import {TQueryUpdate} from "./TQueryUpdate";
import {TQueryDelete} from "./TQueryDelete";
import {TLiteral} from "./TLiteral";
import {TQueryFunctionCall} from "./TQueryFunctionCall";
import {TVariable} from "./TVariable";
import {TNull} from "./TNull";


export type TQueryAnyType = TQueryExpression | TQueryFunctionCall | TQueryComparisonExpression | TQueryComparison | TQueryColumn | TString | TNull | TLiteral | TNumber | TVariable | TBoolValue | TQuerySelect | TQueryUpdate | TQueryDelete | TColumn;