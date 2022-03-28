import {parse, TFuncGen} from "../parse";
import {TParser} from "../TParser";
import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {isGeneratorFunction} from "../isGenerator";



export function oneOf(params: (TFuncGen | TParser)[], error: string) {
    return (s: Stream) => {

        let results = undefined;
        for (let i = 0; i < params.length; i++) {

            if (isGeneratorFunction(params[i])) {
                results = parse((name, value) => {}, params[i] as TFuncGen, s)
            } else {
                results = parse((name, value) => {}, [params[i] as TParser], s);
            }
            if (results.kind === "ParseResult") {
                return new ParseResult((results as ParseResult).value, (results as ParseResult).next, s, "");
            }
        }
        return new ParseError(s, error + " STACK " + JSON.stringify(results), false);
    }
}