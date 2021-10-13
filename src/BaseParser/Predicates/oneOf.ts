import {parse, TFuncGen} from "../parse";
import {TParser} from "../TParser";
import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {isGenerator} from "../isGenerator";



export function oneOf(params: (TFuncGen | TParser)[], error: string) {
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
                return new ParseResult((results as ParseResult).value, (results as ParseResult).next, s, "");
            }
        }
        return new ParseError(s, error, false);
    }
}