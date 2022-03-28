import {TDateCmp} from "../Date/TDateCmp";
import {isNumeric} from "../Numeric/isNumeric";
import {numeric} from "../Numeric/numeric";
import {numericCmp} from "../Numeric/numericCmp";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {TDate} from "../Query/Types/TDate";
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
import {numericFromNumber} from "../Numeric/numericFromNumber";
import {numericLoad} from "../Numeric/numericLoad";
import {TBooleanResult} from "./TBooleanResult";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";
import {kBooleanResult} from "./kBooleanResult";


export function compareValues(a: string | number | boolean | bigint | numeric | TDate | TTime | TDateTime | TBooleanResult,
                              b: string | number | boolean | bigint | numeric | TDate | TTime | TDateTime | TBooleanResult) {
    if (b === undefined) {
        if (a === undefined) {
            return 0;
        }
        return 1;
    }
    if (a === undefined) {
        if (b === undefined) {
            return 0;
        }
        return -1;
    }
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
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
        return 0;
    }
    if (typeof a === "boolean" && typeof b === "boolean") {
        if (a === b) {
            return 0;
        }
        return a && b;
    }
    if (typeof a === "bigint" && typeof b === "bigint") {
        if (a === b) {
            return 0;
        }
        if (a > b) {
            return 1;
        }
        return -1;
    }

    if (isNumeric(a) && isNumeric(b)) {
        return numericCmp(a, b);
    }

    if (isNumeric(a) || isNumeric(b)) {
        let an: numeric = undefined;
        let bn: numeric = undefined;
        if (isNumeric(a)) {
            an = a;
        } else if (typeof a === "number") {
            an = numericFromNumber(a);
        } else if (typeof a === "string") {
            try {
                an = numericLoad(a as string);
            } catch (errorConversion) {
                throw new TParserError("Error converting " + a + " to numeric.");
            }
        }
        if (isNumeric(b)) {
            bn = b;
        } else if (typeof b === "number") {
            bn = numericFromNumber(b);
        } else if (typeof b === "string") {
            try {
                bn = numericLoad(b as string);
            } catch (errorConversion) {
                throw new TParserError("Error converting " + b + " to numeric.");
            }
        }
        return numericCmp(an, bn);

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

    if (instanceOfTBooleanResult(a) && instanceOfTBooleanResult(b)) {
        if (a.value === b.value) {
            return 0;
        }
        if (a.value === kBooleanResult.isTrue && b.value !== kBooleanResult.isTrue) {
            return 1;
        }
        if (a.value !== kBooleanResult.isTrue && b.value === kBooleanResult.isTrue) {
            return -1;
        }
        return -1;
    }


    throw "Comparison between values " + a  + " and " + b + " not implemented.";

}