


export const NUMERIC_MAX_EXP = 999;
export const NUMERIC_NAN_EXP = 2000;
export const NUMERIC_MAX = Number.MAX_SAFE_INTEGER / 10;

/*
    Representation of a numeric
    sign is 1 if the numeric is negative
    m contains the value as an integer
    e specifies the number of decimals
 */

export interface numeric {
    sign: number;
    approx: number;
    e: number;
    m: number;
}


