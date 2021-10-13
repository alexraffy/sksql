import {kQueryComparison} from "../Enums/kQueryComparison";


export interface TComparison {
    kind: "TComparison";
    negative: boolean;
    value: kQueryComparison;
}