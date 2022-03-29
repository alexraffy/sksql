import {TParser} from "../TParser";
import {parse, TFuncGen} from "../parse";
import {Stream} from "../Stream";
import {ParseError} from "../ParseError";
import {ParseResult} from "../ParseResult";
import {isAlphaNumeric, isLetter, isSpace} from "./types";
import {isGeneratorFunction} from "../isGenerator";
import {instanceOfParseResult} from "../Guards/instanceOfParseResult";


export function atLeast1(predicate: TParser | TFuncGen) {
    return (input: Stream) => {
        let num = 0;
        let value: string | any[] = undefined;
        let match: string = "";
        let next = input;
        let results: ParseResult | ParseError = {start: input, kind: "ParseResult", value: undefined, next: input, matched: ""} as ParseResult;
        while (instanceOfParseResult(results)) {
            if (isGeneratorFunction(predicate)) {
                results = parse((name, value) => {
                }, predicate as TFuncGen, next);
            } else {
                results = parse((name, value) => {
                }, [predicate as TParser], next)
            }
            if (instanceOfParseResult(results)) {
                next = next.next();
                match = match + results.matched;
                if (typeof results.value === "string") {
                    if (value === undefined) {
                        value = results.value
                    } else {
                        value = value + results.value;
                    }
                } else {
                    if (results.value !== undefined) {
                        if (value === undefined) {
                            value = [results.value];
                        }
                    } else {
                        (value as any[]).push(results.value)
                    }
                }
                num++;
            }
        }
        if (num > 0) {
            return new ParseResult(value, next, input, match);
        } else {
            return new ParseError(input, "expected at least 1 of ", false);
        }

    };
}