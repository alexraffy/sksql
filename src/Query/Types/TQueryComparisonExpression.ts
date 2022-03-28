import {TQueryComparisonDEPREC} from "./TQueryComparison";
import {TQueryComparisonColumnEqualsString} from "./TQueryComparisonColumnEqualsString";


export interface TQueryComparisonExpressionDEPREC {
    kind: "TQueryComparisonExpression"
    a: TQueryComparisonExpressionDEPREC | TQueryComparisonDEPREC | TQueryComparisonColumnEqualsString,
    bool: "AND" | "AND NOT" | "OR",
    b: TQueryComparisonExpressionDEPREC | TQueryComparisonDEPREC | TQueryComparisonColumnEqualsString
}