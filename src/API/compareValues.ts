import { TDateCmp } from "../Date/TDateCmp";
import { isNumeric } from "../Numeric/isNumeric";
import { numeric } from "../Numeric/numeric";
import { numericCmp } from "../Numeric/numericCmp";
import { instanceOfTDate } from "../Query/Guards/instanceOfTDate";
import { instanceOfTNumber } from "../Query/Guards/instanceOfTNumber";
import { instanceOfTString } from "../Query/Guards/instanceOfTString";
import { TDate } from "../Query/Types/TDate";
import { TQueryAnyType } from "../Query/Types/TQueryAnyType";
import {TTime} from "../Query/Types/TTime";
import {TDateTime} from "../Query/Types/TDateTime";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {TTimeCmp} from "../Date/TTimeCmp";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {TDateTimeCmp} from "../Date/TDateTimeCmp";
import {parseTimeString} from "../Date/parseTimeString";
import {parseDateString} from "../Date/parseDateString";
import {TParserError} from "./TParserError";
import {parseDateTimeString} from "../Date/parseDateTimeString";



export function compareValues(a: string | number | boolean | bigint | numeric | TDate | TTime | TDateTime, b: string | number | boolean | bigint | numeric | TDate | TTime | TDateTime) {
    if (typeof a === "string" && typeof b === "string") {
        let sc = a.localeCompare(b);
        if (sc >= 1) { return 1;}
        if (sc <= -1) { return -1;}
        return 0;
    }
    if (typeof a === "number" && typeof b === "number") {
        if (a === b) {
            return 0;
        }
        return a - b;
    }
    if (typeof a === "boolean" && typeof b === "boolean") {
        return a === b;
    }
    if (typeof a === "bigint" && typeof b === "bigint") {
        return a === b;
    }

    if (isNumeric(a) && isNumeric(b)) {
        return numericCmp(a, b);
    }

    if (instanceOfTDate(a) || instanceOfTDate(b)) {
        let ad: TDate = undefined;
        let bd: TDate = undefined;
        let parseStringAsDateOrDateTime = (o: TDate | TDateTime | string) => {
            if (instanceOfTDateTime(o)) {
                return o.date;
            }
            if (instanceOfTDate(o)) {
                return o;
            }
            if (typeof o === "string") {
                let isDT = parseDateTimeString(o);
                if (isDT) {
                    return isDT.date;
                } else {
                    return parseDateString(o);
                }
            }
            throw new TParserError("Expected a date, instead got " + (o));
        }
        ad = parseStringAsDateOrDateTime(a as TDate | TDateTime | string);
        bd = parseStringAsDateOrDateTime(b as TDate | TDateTime | string);
        return TDateCmp(ad, bd);
    }

    if (instanceOfTDateTime(a) || instanceOfTDateTime(b)) {
        let ad: TDateTime = undefined;
        let bd: TDateTime = undefined;
        let parseStringAsDateTime = (o: TDate | TDateTime | string) => {
            if (instanceOfTDateTime(o)) {
                return o;
            }
            if (typeof o === "string") {
                let isDT = parseDateTimeString(o);
                if (isDT) {
                    return isDT;
                } else {
                    let isDate = parseDateString(o);
                    if (instanceOfTDate(isDate)) {
                        return {
                            kind: "TDateTime",
                            date: isDate,
                            time: {
                                kind: "TTime",
                                hours: 0,
                                minutes: 0,
                                seconds: 0,
                                millis: 0
                            } as TTime
                        } as TDateTime
                    }
                }
            }
            throw new TParserError("Expected a datetime, instead got " + (o));
        }
        ad = parseStringAsDateTime(a as TDate | TDateTime | string);
        bd = parseStringAsDateTime(b as TDate | TDateTime | string);
        return TDateTimeCmp(ad, bd);
    }

    if (instanceOfTTime(a) || instanceOfTTime(b)) {
        let ad: TTime = undefined;
        let bd: TTime = undefined;
        let parseStringAsTTime = (o: TTime | string) => {
            if (instanceOfTTime(o)) {
                return o;
            }
            if (typeof o === "string") {
                let val = parseTimeString(o);
                if (instanceOfTTime(val)) {
                    return val;
                }
            }
            throw new TParserError("Expected a time, instead got " + (o));
        }
        ad = parseStringAsTTime(a as TTime | string);
        bd = parseStringAsTTime(b as TTime | string);
        return TTimeCmp(ad, bd);
    }


    throw "Comparison between values " + a  + " and " + b + " not implemented.";

}