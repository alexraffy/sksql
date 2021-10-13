import {number} from "../../BaseParser/Predicates/number";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TNumber} from "../Types/TNumber";

/*
    tries to parse a number
 */
export const predicateTNumber = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }

    const value = yield number;

    yield returnPred({
        kind: "TNumber",
        value: value
    } as TNumber);
}