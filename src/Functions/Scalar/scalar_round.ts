import {numeric} from "../../Numeric/numeric";
import {numericRound} from "../../Numeric/numericRound";


export function scalar_round(num: numeric, decimals: number) {
    if (num === undefined) { return undefined;}
    return numericRound(num, decimals);
}