import {kQueryComparison} from "./Enums/kQueryComparison";


export function strTokQueryComparison (testing: string) {
    switch (testing) {
        case "<>":
            return kQueryComparison.different;
            break;
        case "<=":
            return kQueryComparison.inferiorEqual;
            break;
        case "<":
            return kQueryComparison.inferior;
            break;
        case ">":
            return kQueryComparison.superior;
            break;
        case ">=":
            return kQueryComparison.superiorEqual;
        case "NOT LIKE":
            return kQueryComparison.notLike;
            break;
        case "LIKE":
            return kQueryComparison.like;
            break;
        case "IN":
            return kQueryComparison.in;
            break;
        case "BETWEEN":
            return kQueryComparison.between;
            break;
        case "=":
            return kQueryComparison.equal;
            break;
    }
}