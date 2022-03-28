import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {TableColumnType} from "../../Table/TableColumnType";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {instanceOfTTime} from "../../Query/Guards/instanceOfTTime";
import {isNumeric} from "../../Numeric/isNumeric";

export function helper_getParametersType(...params: any[]): {type: TableColumnType, valid: boolean} {
    let type: TableColumnType = undefined;
    for (let i = 0; i < params.length; i++) {
        let p = params[i];
        if (p === undefined) {
            continue;
        }
        let t: TableColumnType = undefined;
        if (instanceOfTDate(p)) {
            t = TableColumnType.date;
        } else if (instanceOfTDateTime(p)) {
            t = TableColumnType.datetime;
        } if (instanceOfTTime(p)) {
            t = TableColumnType.time;
        } else if (isNumeric(p)) {
            t = TableColumnType.numeric;
        } else {
            switch (typeof p) {
                case "number":
                case "bigint":
                    t = TableColumnType.numeric;
                    break;
                case "string":
                    t = TableColumnType.varchar;
                    break;
            }
        }
        if (type === undefined) {
            type = t;
        } else if (type !== t) {
            if (t === TableColumnType.numeric) {
                type = TableColumnType.numeric;
            } else {
                return {valid: false, type: t}
            }
        }
    }
    return {valid: true, type: type};
}

export function logical_iif_check(context: TExecutionContext, booleanExpression: boolean, true_value: any, false_value: any):
    {valid: boolean, message: string} {
    let valid = true;
    if (typeof booleanExpression !== "boolean") {
        return {valid: false, message: "iif expects a boolean expression as a first parameter."};
    }
    let test = helper_getParametersType(...[true_value, false_value]);
    if (test.valid === false) {
        return {valid: false, message: "iif expects true_value and false_value parameters to be of the same type"};
    }
    return {valid: true, message: ""};

}


export function logical_iif(context: TExecutionContext, test: boolean, true_value: any, false_value: any) {
    if (test) {
        return true_value;
    }
    return false_value;
}