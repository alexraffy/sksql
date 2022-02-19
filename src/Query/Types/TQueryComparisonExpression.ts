import {TQueryComparison} from "./TQueryComparison";
import {TQueryComparisonColumnEqualsString} from "./TQueryComparisonColumnEqualsString";


export interface TQueryComparisonExpression {
    kind: "TQueryComparisonExpression"
    a: TQueryComparisonExpression | TQueryComparison | TQueryComparisonColumnEqualsString,
    bool: "AND" | "AND NOT" | "OR",
    b: TQueryComparisonExpression | TQueryComparison | TQueryComparisonColumnEqualsString
}