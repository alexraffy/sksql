import {kBooleanResult} from "./kBooleanResult";

// AST Structure for boolean results
export interface TBooleanResult {
    kind: "TBooleanResult";
    value: kBooleanResult;
}