import {numeric} from "../../Numeric/numeric";


export function scalar_abs(input: numeric) {
    if (input.sign === 1) {
        return {
            sign: 0,
            m: input.m,
            e: input.e,
            approx: input.approx
        } as numeric
    }
}