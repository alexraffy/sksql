import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {digit} from "../../BaseParser/Predicates/digit";
import {str} from "../../BaseParser/Predicates/str";



const dateYYYYMMDD = function *(callback) {
    let y1, y2, y3, y4, m1, m2, d1, d2;
    y1 = yield digit;
    y2 = yield digit;
    y3 = yield digit;
    y4 = yield digit;
    yield oneOf([str("-"), str("/")], "");
    m1 = yield digit;
    m2 = yield digit;
    yield oneOf([str("-"), str("/")], "");
    d1 = yield digit;
    d2 = yield digit;
    let year = parseInt(y1) * 1000 + parseInt(y2) * 100 + parseInt(y3) * 10 + parseInt(y4);
    let month = parseInt(m1) * 10 + parseInt(m2);
    let day = parseInt(d1) * 10 + parseInt(d2);
    if (month > 12) {
        yield str("WRONG DATE");
    }
    if (day > 31) {
        yield str("WRONG DATE");
    }
    yield returnPred(
        {
            kind: "TDate",
            year: year,
            month: month,
            day: day
        }
    )
}


const dateMMDDYYYY = function *(callback) {
    let y1, y2, y3, y4, m1, m2, d1, d2;
    m1 = yield digit;
    m2 = yield digit;
    yield oneOf([str("-"), str("/")], "");
    d1 = yield digit;
    d2 = yield digit;
    yield oneOf([str("-"), str("/")], "");
    y1 = yield digit;
    y2 = yield digit;
    y3 = yield digit;
    y4 = yield digit;
    let year = parseInt(y1) * 1000 + parseInt(y2) * 100 + parseInt(y3) * 10 + parseInt(y4);
    let month = parseInt(m1) * 10 + parseInt(m2);
    let day = parseInt(d1) * 10 + parseInt(d2);
    if (month > 12) {
        yield str("WRONG DATE");
    }
    if (day > 31) {
        yield str("WRONG DATE");
    }
    yield returnPred(
        {
            kind: "TDate",
            year: year,
            month: month,
            day: day
        }
    )
}


const dateDDMMYYYY = function *(callback) {
    let y1, y2, y3, y4, m1, m2, d1, d2;
    d1 = yield digit;
    d2 = yield digit;
    yield oneOf([str("-"), str("/")], "");
    m1 = yield digit;
    m2 = yield digit;
    yield oneOf([str("-"), str("/")], "");
    y1 = yield digit;
    y2 = yield digit;
    y3 = yield digit;
    y4 = yield digit;
    let year = parseInt(y1) * 1000 + parseInt(y2) * 100 + parseInt(y3) * 10 + parseInt(y4);
    let month = parseInt(m1) * 10 + parseInt(m2);
    let day = parseInt(d1) * 10 + parseInt(d2);
    if (month > 12) {
        yield str("WRONG DATE");
    }
    if (day > 31) {
        yield str("WRONG DATE");
    }
    yield returnPred(
        {
            kind: "TDate",
            year: year,
            month: month,
            day: day
        }
    )
}


export function *predicateTDate (callback) {
    if (callback === "isGenerator") {
        return;
    }
    let ret = yield oneOf([dateYYYYMMDD, dateMMDDYYYY, dateDDMMYYYY], "");
    if (ret !== undefined) {
        yield returnPred(ret);
    }
}