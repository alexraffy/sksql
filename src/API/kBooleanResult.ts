

// Three-Valued BOOL
// In an expression, if the value of a column is NULL, we return Unknown
// This is used in table CHECK constraints to allow inserts of NULLs
export enum kBooleanResult {
    isTrue = 1,
    isFalse = 0,
    isUnknown = -1
}