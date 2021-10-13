import {TFuncGen} from "../../BaseParser/parse";
import {literal} from "../../BaseParser/Predicates/literal";
import {returnPred} from "../../BaseParser/Predicates/ret";
import {TLiteral} from "../Types/TLiteral";

/*
    tries to parse a literal
    the literal must start with a letter and may contain a digit or underscore character after
 */
export const predicateTLiteral: TFuncGen = function *(callback) {
    //@ts-ignore
    if (callback as string === "isGenerator") {
        return;
    }
    const value = yield literal;
    yield returnPred({
        kind: "TLiteral",
        value: value
    } as TLiteral);

}