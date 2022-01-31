import {TQueryExpression} from "./TQueryExpression";
import {TLiteral} from "./TLiteral";
import {TNumber} from "./TNumber";
import {TQueryColumn} from "./TQueryColumn";
import {kQueryComparison} from "../Enums/kQueryComparison";
import {TBetween} from "./TBetween";
import {TColumn} from "./TColumn";
import {TString} from "./TString";
import {TComparison} from "./TComparison";
import {TNull} from "./TNull";
import { TArray } from "./TArray";
import {TValidExpressions} from "./TValidExpressions";


export interface TQueryComparison {
    kind: "TQueryComparison";
    left: TQueryExpression | TValidExpressions;
    comp: TComparison;
    right: TQueryExpression | TValidExpressions;
}
