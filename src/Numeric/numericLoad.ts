import {numeric} from "./numeric";
import {atLeast1} from "../BaseParser/Predicates/atLeast1";
import {digit} from "../BaseParser/Predicates/digit";
import {parse} from "../BaseParser/parse";
import {maybe} from "../BaseParser/Predicates/maybe";
import {str} from "../BaseParser/Predicates/str";
import {returnPred} from "../BaseParser/Predicates/ret";
import {Stream} from "../BaseParser/Stream";
import {instanceOfParseError} from "../BaseParser/Guards/instanceOfParseError";
import {numericRound} from "./numericRound";
import {TParserError} from "../API/TParserError";
import {numericWillOverflow} from "./numericMulOverflow";

/*
    parse a string and returns a numeric
 */
export function numericLoad(value: string, p: number = undefined, d: number = undefined): numeric {
    let ret : numeric = {
        sign: 0,
        m: 0,
        e: 0,
        approx: 0
    };

    let result = parse((name, value) => {} , function *(callback) {
        // @ts-ignore
        if (callback === "isGenerator") {
            return;
        }
        let sign = yield maybe(str("-"));
        let m = yield atLeast1(digit);
        yield maybe(str("."));
        let e = yield maybe(atLeast1(digit));
        yield returnPred(
            {
                sign: sign,
                m: m,
                e: (e === undefined) ? "" : e
            }
        )
    }, new Stream(value, 0));
    if (instanceOfParseError(result)) {
        throw "Not a numeric";
    }
    let val: {sign: string, m: string, e: string} = result.value;

    ret.sign = val.sign === "-" ? 1 : 0;
    ret.m = parseInt(val.m + val.e);
    ret.e = -val.e.length;

    if (p !== undefined && d !== undefined) {
        let mLength = ret.m.toString().length;
        let eLength = val.e.length;
        if (eLength > d) {
            ret = numericRound(ret, d);
            eLength = d;
        }
        while (d > -ret.e) {
            ret.m *= 10;
            ret.e--;
        }
        mLength = ret.m.toString().length;
        if (p - d < mLength - (-ret.e)) {
            throw new TParserError("Arithmetic overflow error converting numeric to data type numeric");
        }

    }


    return numericWillOverflow(ret);
}

