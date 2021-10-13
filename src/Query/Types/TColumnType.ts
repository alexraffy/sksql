import {TNumber} from "./TNumber";
import {TBoolValue} from "./TBoolValue";


export interface TColumnType {
    kind: "TColumnType",
    type: string,
    size: TNumber,
    dec?: TNumber,
    isNullable: TBoolValue;
}