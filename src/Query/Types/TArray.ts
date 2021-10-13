import {TQueryAnyType} from "./TQueryAnyType";


export interface TArray {
    kind: "TArray",
    array: TQueryAnyType[]
}