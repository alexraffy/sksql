import {TQueryExpression} from "./TQueryExpression";
import {TLiteral} from "./TLiteral";
import {TNumber} from "./TNumber";
import {TQueryColumn} from "./TQueryColumn";
import {kQueryComparison} from "../Enums/kQueryComparison";
import {TBetween} from "./TBetween";
import {TColumn} from "./TColumn";
import {TString} from "./TString";
import {TComparisonDEPREC} from "./TComparison";
import {TNull} from "./TNull";
import { TArray } from "./TArray";
import {TValidExpressions} from "./TValidExpressions";


export interface TQueryComparisonDEPREC {
    kind: "TQueryComparison";
    left: TQueryExpression | TValidExpressions;
    comp: TComparisonDEPREC;
    right: TQueryExpression | TValidExpressions;
}
