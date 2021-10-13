import {returnPred} from "../../BaseParser/Predicates/ret";
import {either} from "../../BaseParser/Predicates/either";
import {str} from "../../BaseParser/Predicates/str";
import {oneOf} from "../../BaseParser/Predicates/oneOf";

/*
    tries to parse TRUE | FALSE
 */
export const predicateTBoolValue = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    const value = yield oneOf([str("TRUE"), str("FALSE")], "");
    yield returnPred(
        {
            kind: "TBoolValue",
            value: (value.toUpperCase() === "TRUE") ? true : false
        }
    );
}