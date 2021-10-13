import {TQueryComparison} from "./TQueryComparison";


export interface TQueryComparisonExpression {
    kind: "TQueryComparisonExpression"
    a: TQueryComparisonExpression | TQueryComparison,
    bool: "AND" | "AND NOT" | "OR",
    b: TQueryComparisonExpression | TQueryComparison
}