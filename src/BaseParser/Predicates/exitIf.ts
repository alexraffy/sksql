import {TParser} from "../TParser";
import {isGeneratorFunction} from "../isGenerator";
import {parse, TFuncGen} from "../parse";
import {ParseResult} from "../ParseResult";
import {Stream} from "../Stream";
import {ParseError} from "../ParseError";


export const exitIf = function (parser: TFuncGen | TParser): TParser {
    return (s: Stream) => {
        //@ts-ignore
        if (s as string === "isGenerator") {
            return;
        }
        let results = undefined;
        if (isGeneratorFunction(parse)) {
            results = parse((name, value) => {}, parser as TFuncGen, s)
        } else {
            results = parse((name, value) => {}, [parser as TParser], s);
        }
        if (results.kind === "ParseResult") {
            return new ParseResult(true, s, s, "");
        }
        return new ParseResult(false, s, s, "");
    }

}