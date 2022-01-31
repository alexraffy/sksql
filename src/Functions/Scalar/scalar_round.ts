import {numeric} from "../../Numeric/numeric";
import {numericRound} from "../../Numeric/numericRound";
import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";


export function scalar_round(context: TExecutionContext, num: numeric, decimals: number) {
    if (num === undefined) { return undefined;}
    return numericRound(num, decimals);
}