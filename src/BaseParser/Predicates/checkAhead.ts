import {parse, TFuncGen} from "../parse";
import {TParser} from "../TParser";
import {Stream} from "../Stream";
import {isGeneratorFunction} from "../isGenerator";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";


export function checkAhead(params: (TFuncGen | TParser)[], error: string) {
    return (s: Stream) => {

        for (let i = 0; i < params.length; i++) {
            let results = undefined;

            if (isGeneratorFunction(params[i])) {
                results = parse((name, value) => {}, params[i] as TFuncGen, s)
            } else {
                results = parse((name, value) => {}, [params[i] as TParser], s);
            }
            if (results.kind === "ParseResult") {
                return new ParseResult((results as ParseResult).value, s, s, "");
            }
        }
        return new ParseError(s, error, false);
    }
}