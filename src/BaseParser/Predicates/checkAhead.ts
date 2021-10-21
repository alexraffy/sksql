import {parse, TFuncGen} from "../parse";
import {TParser} from "../TParser";
import {Stream} from "../Stream";
import {isGenerator} from "../isGenerator";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";


export function checkAhead(params: (TFuncGen | TParser)[], error: string) {
    return (s: Stream) => {
        //@ts-ignore
        if (s as string === "isGenerator") {
            return;
        }
        for (let i = 0; i < params.length; i++) {
            let results = undefined;

            if (isGenerator(params[i])) {
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