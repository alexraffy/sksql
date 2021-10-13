import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {TNull} from "../Types/TNull";

/*
    tries to parse the value null
 */
export const predicateTNull = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    yield str("null");
    yield returnPred({
        kind: "TNull"
    } as TNull)
}