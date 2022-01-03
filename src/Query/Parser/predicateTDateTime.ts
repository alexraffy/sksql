import {atLeast1} from "../../BaseParser/Predicates/atLeast1";
import {digit} from "../../BaseParser/Predicates/digit";
import {str} from "../../BaseParser/Predicates/str";
import {maybe} from "../../BaseParser/Predicates/maybe";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TTime} from "../Types/TTime";
import {predicateTDate} from "./predicateTDate";
import {oneOf} from "../../BaseParser/Predicates/oneOf";
import {predicateTTime} from "./predicateTTime";
import {TDateTime} from "../Types/TDateTime";


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