import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {instanceOfTTime} from "../../Query/Guards/instanceOfTTime";
import {isNumeric} from "../../Numeric/isNumeric";
import {TDateCmp} from "../../Date/TDateCmp";
import {TDateTimeCmp} from "../../Date/TDateTimeCmp";
import {TTimeCmp} from "../../Date/TTimeCmp";
import {numericCmp} from "../../Numeric/numericCmp";


export function logical_nullif (context: TExecutionContext, a: any, b: any) {
    if (a === undefined) {
        return undefined;
    }
    if (instanceOfTDate(a)) {
        if (!instanceOfTDate(b)) {
            return a;
        }
        if (TDateCmp(a, b) === 0) {
            return undefined;
        }
        return a;
    } else if (instanceOfTDateTime(a)) {
        if (!instanceOfTDateTime(b)) {
            return a;
        }
        if (TDateTimeCmp(a, b) === 0) {
            return undefined;
        }
        return a;
    } if (instanceOfTTime(a)) {
        if (!instanceOfTTime(b)) {
            return a;
        }
        if (TTimeCmp(a, b) === 0) {
            return undefined;
        }
        return a;
    } else if (isNumeric(a)) {
        if (!isNumeric(b)) {
            return a;
        }
        if (numericCmp(a, b) === 0) {
            return undefined;
        }
        return a;
    } else {
        switch (typeof a) {
            case "number":
            case "bigint": {
                if (!["number", "bigint"].includes(typeof b)) {
                    return a;
                }
                if (a === b) {
                    return undefined;
                }
                return a;
            }
            break;
            case "string": {
                if (!(typeof b === "string")) {
                    return a;
                }
                if (a.localeCompare(b) === 0) {
                    return undefined;
                }
                return a;
            }
            break;
        }
    }
    return a;

}