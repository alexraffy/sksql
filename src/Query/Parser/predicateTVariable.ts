import {returnPred} from "../../BaseParser/Predicates/ret";
import {TVariable} from "../Types/TVariable";
import {str} from "../../BaseParser/Predicates/str";
import {literal} from "../../BaseParser/Predicates/literal";

/*
    tries to parse a variable
    @variable
 */
export const predicateTVariable = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    const arobase = yield str("@");
    const name = yield literal;
    yield returnPred(
        {
            kind: "TVariable",
            name: arobase + name,
        } as TVariable
    )
}