import {returnPred} from "../../BaseParser/Predicates/ret";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";

/*
    tries to parse TRUE | FALSE
 */
export const predicateTBoolValue = function *(callback) {

    const value = yield oneOf([str("TRUE"), str("FALSE")], "");
    yield returnPred(
        {
            kind: "TBoolValue",
            value: (value.toUpperCase() === "TRUE") ? true : false
        }
    );
}