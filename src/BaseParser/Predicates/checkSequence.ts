import {parse, TFuncGen} from "../parse";
import {TParser} from "../TParser";
import {Stream} from "../Stream";
import {isGeneratorFunction} from "../isGenerator";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";

// Consume a sequence of predicates

// example: yield checkSequence([literal, whitespace]);
// will return a positive result if a literal is followed by a whitespace

export function checkSequence(params: (TFuncGen | TParser)[]) {
    return (s: Stream) => {
        let returnStruct: any[] = [];
        let next = s;
        for (let i = 0; i < params.length; i++) {
            let results = undefined;

            if (isGeneratorFunction(params[i])) {
                results = parse((name, value) => {}, params[i] as TFuncGen, next)
            } else {
                results = parse((name, value) => {}, [params[i] as TParser], next);
            }
            if (results.kind === "ParseResult") {
                returnStruct.push((results as ParseResult).value);
                next = (results as ParseResult).next;
                //return new ParseResult((results as ParseResult).value, s, s, "");
            }
            if (results.kind === "ParseError") {
                return new ParseError(s, "", false);
            }
        }
        return new ParseResult(returnStruct, next, s, "");
    }
}