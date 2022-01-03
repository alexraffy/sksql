import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {digit} from "../../BaseParser/Predicates/digit";
import {str} from "../../BaseParser/Predicates/str";
import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {TTime} from "../Types/TTime";


export function *predicateTTime (callback) {
    if (callback === "isGenerator") {
        return;
    }
    const hours = yield atLeast1(digit);
    yield str(":");
    const minutes = yield atLeast1(digit);
    yield maybe(str(":"));
    const seconds = yield maybe(atLeast1(digit));
    yield maybe(str("."));
    const millis = yield maybe(atLeast1(digit));
    if (hours >= 24 || hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60 || millis < 0) {
        yield str("a valid time in 24 format");
    }
    yield returnPred(
        {
            kind: "TTime",
            hours: parseInt(hours),
            minutes: parseInt(minutes),
            seconds: seconds === undefined ? 0 : parseInt(seconds),
            millis: millis === undefined ? 0 : parseInt(millis)
        } as TTime
    )
}