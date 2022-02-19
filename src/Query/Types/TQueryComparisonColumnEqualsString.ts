import {TVariable} from "./TVariable";
import {TString} from "./TString";
import {TColumn} from "./TColumn";


export interface TQueryComparisonColumnEqualsString {
    kind: "TQueryComparisonColumnEqualsString";
    column: TColumn;
    value: TString | TVariable;
}