import {kQueryComparison} from "../Enums/kQueryComparison";


export interface TComparisonDEPREC {
    kind: "TComparison";
    negative: boolean;
    value: kQueryComparison;
}