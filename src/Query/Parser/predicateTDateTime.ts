
import {str} from "../../BaseParser/Predicates/str";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {predicateTDate} from "./predicateTDate";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTTime} from "./predicateTTime";
import {TDateTime} from "../Types/TDateTime";

// parse a datetime in a string

export function *predicateTDateTime (callback) {
    if (callback === "isGenerator") {
        return;
    }
    const date = yield predicateTDate;
    yield oneOf([str("T"), str(" ")], "T or empty space between date and time");
    const time = yield predicateTTime;
    yield returnPred(
        {
            kind: "TDateTime",
            date: date,
            time: time
        } as TDateTime
    )
}