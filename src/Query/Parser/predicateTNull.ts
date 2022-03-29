import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {TNull} from "../Types/TNull";

/*
    tries to parse the value null
 */
export const predicateTNull = function *(callback) {

    yield str("null");
    yield returnPred({
        kind: "TNull"
    } as TNull)
}