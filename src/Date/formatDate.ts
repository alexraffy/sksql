import {TDate} from "../Query/Types/TDate";
import {TDateTime} from "../Query/Types/TDateTime";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {parse} from "../BaseParser/parse";
import {eof, isEOF} from "../BaseParser/Predicates/eof";
import {Stream} from "../BaseParser/Stream";
import {str} from "../BaseParser/Predicates/str";
import {maybe} from "../BaseParser/Predicates/maybe";
import {ParseResult} from "../BaseParser/ParseResult";
import {ParseError} from "../BaseParser/ParseError";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {anyCharacter} from "../BaseParser/Predicates/anyCharacter";

export enum kFormatDateTime {
    datetime_iso = "YYYY-MM-DDTHH:mm:ss.SSSZ",
    date_iso = "YYYY-MM-DD"
}

function fd_d(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return d.day.toString();
        case "TDateTime":
            return d.date.day.toString();
    }
}

function fd_dd(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return d.day.toString().padStart(2, "0");
        case "TDateTime":
            return d.date.day.toString().padStart(2, "0");
    }
}

function fd_ddd(d: TDate | TDateTime, jd: Date) {
    return (new Intl.DateTimeFormat("default", {weekday: "short"})).format(jd);
}

function fd_dddd(d: TDate | TDateTime, jd: Date) {
    return (new Intl.DateTimeFormat("default", {weekday: "long"})).format(jd);
}


function fd_M(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "0";
        case "TDateTime":
            return d.date.month.toString();
    }
}

function fd_MM(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "0";
        case "TDateTime":
            return d.date.month.toString().padStart(2, "0");
    }
}


function fd_MMM(d: TDate | TDateTime, jd: Date) {
    return (new Intl.DateTimeFormat("default", {month: "short"})).format(jd);
}

function fd_MMMM(d: TDate | TDateTime, jd: Date) {
    return (new Intl.DateTimeFormat("default", {month: "long"})).format(jd);
}

function fd_y(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate": {
            let y = d.year.toString();
            if (y.length >= 2) {
                return parseInt(y.substring(y.length - 1)).toString();
            } else {
                return parseInt(y).toString();
            }
        }
        break;
        case "TDateTime": {
            let y = d.date.year.toString();
            if (y.length >= 2) {
                return parseInt(y.substring(y.length - 1)).toString();
            } else {
                return parseInt(y).toString();
            }
        }
            break;
    }
}

function fd_yy(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate": {
            let y = d.year.toString();
            if (y.length >= 2) {
                return parseInt(y.substring(y.length - 2)).toString().padStart(2, "0");
            } else {
                return parseInt(y).toString().padStart(2, "0");
            }
        }
            break;
        case "TDateTime": {
            let y = d.date.year.toString();
            if (y.length >= 3) {
                return parseInt(y.substring(y.length - 2)).toString().padStart(2, "0");
            } else {
                return parseInt(y).toString().padStart(2, "0");
            }
        }
        break;
    }
}


function fd_yyy(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate": {
            let y = d.year.toString();
            if (y.length >= 3) {
                return parseInt(y.substring(y.length - 3)).toString().padStart(3, "0");
            } else {
                return parseInt(y).toString().padStart(3, "0");
            }
        }
            break;
        case "TDateTime": {
            let y = d.date.year.toString();
            if (y.length >= 3) {
                return parseInt(y.substring(y.length - 3)).toString().padStart(3, "0");
            } else {
                return parseInt(y).toString().padStart(3, "0");
            }
        }
    }
}


function fd_yyyy(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate": {
            let y = d.year.toString();
            if (y.length >= 4) {
                return parseInt(y.substring(y.length - 4)).toString().padStart(4, "0");
            } else {
                return parseInt(y).toString().padStart(4, "0");
            }
        }
            break;
        case "TDateTime": {
            let y = d.date.year.toString();
            if (y.length >= 4) {
                return parseInt(y.substring(y.length - 4)).toString().padStart(4, "0");
            } else {
                return parseInt(y).toString().padStart(4, "0");
            }
        }
    }
}


function fd_h(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "0";
        case "TDateTime": {
            let i = d.time.hours;
            let j = 0;
            if (i === 0) {
                j = 12;
            } else if (i <= 12) {
                j = i;
            } else {
                j = i - 12;
            }
            return j.toString();
        }
            break;
    }
}

function fd_hh(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "00";
        case "TDateTime": {
            let i = d.time.hours;
            let j = 0;
            if (i === 0) {
                j = 12;
            } else if (i <= 12) {
                j = i;
            } else {
                j = i - 12;
            }
            return j.toString().padStart(2, "0");
        }
    }
}

function fd_H(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "0";
        case "TDateTime": {
            return d.time.hours.toString()
        }
    }
}

function fd_HH(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "00";
        case "TDateTime": {
            return d.time.hours.toString().padStart(2, "0");
        }
    }
}

function fd_m(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "0";
        case "TDateTime": {
            return d.time.minutes.toString();
        }
    }
}

function fd_mm(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "00";
        case "TDateTime": {
            return d.time.minutes.toString().padStart(2, "0");
        }
    }
}

function fd_s(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "0";
        case "TDateTime": {
            return d.time.seconds.toString();
        }
        break;
    }
}

function fd_ss(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "00";
        case "TDateTime": {
            return d.time.seconds.toString().padStart(2, "0");
        }
        break;
    }
}

function fd_S(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "0";
        case "TDateTime": {
            return d.time.millis.toString();
        }
            break;
    }
}

function fd_SS(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "00";
        case "TDateTime": {
            return d.time.millis.toString().padStart(2, "0");
        }
            break;
    }
}

function fd_SSS(d: TDate | TDateTime, jd: Date) {
    switch (d.kind) {
        case "TDate":
            return "000";
        case "TDateTime": {
            return d.time.millis.toString().padStart(3, "0");
        }
            break;
    }
}



function strCase(equalsTo: string): (input: Stream) => ParseResult | ParseError {
    return (input: Stream): ParseResult | ParseError => {

        if (input.EOF) {
            return new ParseError(input, equalsTo  + " got EOF instead.", false);
        }


        let value = "";
        let character = input.get();
        let idx = 0;
        let s = input;
        while (character === equalsTo[idx]) {
            value += character;

            s = s.next();
            if (s.EOF) {
                break;
            }
            idx++;
            character = s.get();
        }
        if (value === equalsTo) {
            return new ParseResult(value, s, input, value);
        } else {
            let readAhead = character;
            let nextInput = input.next();
            while (nextInput.EOF === false && character !== " ") {
                character = nextInput.get();
                if (character !== " ") {
                    readAhead += character;
                }
                nextInput = nextInput.next();
            }
            return new ParseError(input, equalsTo + " got " + readAhead + " instead", false);
        }
    }
}


export function formatDate(d: TDate | TDateTime, format: kFormatDateTime | string): string {
    let output = "";
    let jd: Date;
    if (instanceOfTDate(d)) {
        Date.parse(d.year + "-" + d.month.toString().padStart(2, "0") + "-" + d.day.toString().padStart(2, "0"));
    } else if (instanceOfTDateTime(d)) {
        Date.parse(d.date.year + "-" + d.date.month.toString().padStart(2, "0") + "-" + d.date.day.toString().padStart(2, "0") + "T" +
        d.time.hours.toString().padStart(2, "0") + ":" + d.time.minutes.toString().padStart(2, "0") + ":" + d.time.seconds.toString().padStart(2, "0"));
    }
    let ps = parse(()=> {}, function*() {
        let endof = yield isEOF;
        while (endof === false) {
            let yyyy = yield maybe(str("YYYY"));
            if (yyyy) { output += fd_yyyy(d, jd); }
            let yyy = yield maybe(str("YYY"));
            if (yyy) { output += fd_yyy(d, jd); }
            let yy = yield maybe(str("YY"));
            if (yy) { output += fd_yy(d, jd); }
            let y = yield maybe(str("Y"));
            if (y) { output += fd_y(d, jd); }
            let MMMM = yield maybe(strCase("MMMM"));
            if (MMMM) { output += fd_MMMM(d, jd);}
            let MMM = yield maybe(strCase("MMM"));
            if (MMM) { output += fd_MMM(d, jd);}
            let MM = yield maybe(strCase("MM"));
            if (MM) { output += fd_MM(d, jd);}
            let M = yield maybe(strCase("M"));
            if (M) { output += fd_M(d, jd);}
            let dddd = yield maybe(str("dddd"));
            if (dddd) { output += fd_dddd(d, jd);}
            let ddd = yield maybe(str("ddd"));
            if (ddd) { output += fd_ddd(d, jd);}
            let dd = yield maybe(str("dd"));
            if (dd) { output += fd_dd(d, jd);}
            let _d = yield maybe(str("d"));
            if (_d) { output += fd_d(d, jd);}
            let HH = yield maybe(strCase("HH"));
            if (HH) { output += fd_HH(d, jd);}
            let H = yield maybe(strCase("H"));
            if (H) { output += fd_H(d, jd);}
            let hh = yield maybe(strCase("hh"));
            if (hh) { output += fd_hh(d, jd);}
            let h = yield maybe(strCase("h"));
            if (h) { output += fd_h(d, jd);}
            let mm = yield maybe(strCase("mm"));
            if (mm) { output += fd_mm(d, jd);}
            let m = yield maybe(strCase("m"));
            if (m) { output += fd_m(d, jd);}
            let ss = yield maybe(strCase("ss"));
            if (ss) { output += fd_ss(d, jd);}
            let s = yield maybe(strCase("s"));
            if (s) { output += fd_s(d, jd);}
            let SSS = yield maybe(strCase("SSS"));
            if (SSS) { output += fd_SSS(d, jd);}
            let SS = yield maybe(strCase("SS"));
            if (SS) { output += fd_SS(d, jd);}
            let S = yield maybe(strCase("S"));
            if (S) { output += fd_S(d, jd);}
            let other = yield maybe(anyCharacter);
            if (other) { output += other;}
            endof = yield isEOF;
        }
    }, new Stream(format, 0));

    return output;
}