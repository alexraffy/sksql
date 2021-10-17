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


export interface TQueryComparison {
    kind: "TQueryComparison";
    left: TQueryExpression | TNull | TColumn | TString | TLiteral | TNumber | TQueryColumn;
    comp: TComparison;
    right: TQueryExpression | TNull | TColumn | TString | TLiteral | TNumber | TQueryColumn | TArray;
}
