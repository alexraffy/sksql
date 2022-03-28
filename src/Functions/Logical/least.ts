import {TExecutionContext} from "../../ExecutionPlan/TExecutionContext";
import {instanceOfTDate} from "../../Query/Guards/instanceOfTDate";
import {instanceOfTDateTime} from "../../Query/Guards/instanceOfTDateTime";
import {instanceOfTTime} from "../../Query/Guards/instanceOfTTime";
import {isNumeric} from "../../Numeric/isNumeric";
import {numeric} from "../../Numeric/numeric";
import {TDate} from "../../Query/Types/TDate";
import {TDateTime} from "../../Query/Types/TDateTime";
import {TTime} from "../../Query/Types/TTime";
import {convertValue} from "../../API/convertValue";
import {TableColumnType} from "../../Table/TableColumnType";
import {TParserError} from "../../API/TParserError";
import {numericCmp} from "../../Numeric/numericCmp";
import {TDateTimeCmp} from "../../Date/TDateTimeCmp";
import {TDateCmp} from "../../Date/TDateCmp";
import {TTimeCmp} from "../../Date/TTimeCmp";
import {columnTypeIsInteger} from "../../Table/columnTypeIsInteger";


export function logical_least(context: TExecutionContext, ...params: any) {
    let type: TableColumnType = undefined;
    let ret: any[] = [];
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
                    t = TableColumnType.int32;
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
            }
        }
        ret.push(p);
    }
    if (ret.length === 0) {
        return undefined;
    }
    let leastValue : string | number | bigint | boolean | numeric | TDateTime | TDate | TTime = undefined;
    for (let i = 0; i < ret.length; i++) {
        if (leastValue === undefined) {
            let v = convertValue(ret[i], type);
            leastValue = v;
        } else {
            try {
                let v = convertValue(ret[i], type);
                switch (type) {
                    case TableColumnType.numeric: {
                        if (isNumeric(v) && isNumeric(leastValue)) {
                            if (numericCmp(v, leastValue) === -1) {
                                leastValue = v;
                            }
                        }
                    }
                    break;
                    case TableColumnType.varchar: {
                        if ((leastValue as string).localeCompare(v as string) < 0) {
                            leastValue = v;
                        }
                    }
                    break;
                    case TableColumnType.datetime: {
                        if (TDateTimeCmp(leastValue as TDateTime, v as TDateTime) === -1) {
                            leastValue = v;
                        }
                    }
                    break;
                    case TableColumnType.date: {
                        if (TDateCmp(leastValue as TDate, v as TDate) === -1) {
                            leastValue = v;
                        }
                    }
                    break;
                    case TableColumnType.time: {
                        if (TTimeCmp(leastValue as TTime, v as TTime) === -1) {
                            leastValue = v;
                        }
                    }
                    break;
                }
                if (columnTypeIsInteger(type)) {
                    if (leastValue > v) {
                        leastValue = v;
                    }
                }
            } catch (e) {
                throw new TParserError("LEAST expects all expressions to be of the same type.");
            }
        }
    }
    return leastValue;
}