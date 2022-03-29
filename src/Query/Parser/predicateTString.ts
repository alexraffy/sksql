import {TFuncGen} from "../../BaseParser/parse";
import {quotedString} from "../../BaseParser/Predicates/quotedString";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TString} from "../Types/TString";

/*
    tries to parse a string starting with double or single quotes
 */
export const predicateTString: TFuncGen = function *(callback) {

    const value = yield quotedString;
    yield returnPred({kind: "TString", value: value} as TString);
}
