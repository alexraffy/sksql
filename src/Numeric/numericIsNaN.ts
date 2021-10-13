import {numeric, NUMERIC_MAX_EXP} from "./numeric";


export const numericIsNaN = (a: numeric) => {
    return a.e > NUMERIC_MAX_EXP && a.m === 0;
}