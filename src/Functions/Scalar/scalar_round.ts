import {numeric} from "../../Numeric/numeric";
import {numericRound} from "../../Numeric/numericRound";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {isNumeric} from "../../Numeric/isNumeric";

// SQL function ROUND
// round the numeric or number to the number of decimals provided.

export function scalar_round(context: TExecutionContext, num: number | numeric, decimals: number) {
    if (num === undefined) { return undefined;}
    if (isNumeric(num)) {
        return numericRound(num, decimals);
    } else {
        if (decimals === 0 || decimals === undefined) {
            return Math.round(num);
        } else {
            return parseFloat(num.toFixed(decimals));
        }
    }
}