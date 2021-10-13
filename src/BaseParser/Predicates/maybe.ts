import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {parse, TFuncGen} from "../parse";
import {TParser} from "../TParser";
import {isGenerator} from "../isGenerator";


export function maybe(predicate: TParser | TFuncGen): TParser {
    return (input: Stream) => {
        //@ts-ignore
        if (input as string === "isGenerator") {
            return;
        }
        let results: ParseResult | ParseError;
        if (isGenerator(predicate)) {
            results = parse((name, value) => {}, predicate as TFuncGen, input);
        } else {
            results = parse((name, value) => {
            }, [predicate as TParser], input)
        }
        if (results.kind === "ParseResult") {
            return new ParseResult((results as ParseResult).value, (results as ParseResult).next, input, "");
        } else {
            return new ParseResult(undefined, input, input, "");
        }
    }
}