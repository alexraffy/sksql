import {Stream} from "./Stream";
import {TParser} from "./TParser";
import {ParseResult} from "./ParseResult";
import {ParseError} from "./ParseError";
import {isGenerator} from "./isGenerator";


export type TParserCallback = (name, value) => void;

export type TFuncGen = ((value: TParserCallback) => IterableIterator<TParser | TFuncGen>) | TParser[];

let parse_inception: number = 0;

export function parse(callback: TParserCallback,
                      genFunc: TFuncGen
                      , input: Stream): ParseResult | ParseError {
    let results: (ParseResult | ParseError)[] = [];
    let success: boolean = true;
    let s = input;

    parse_inception++;
     if (isGenerator(genFunc)) {
         let gen = (genFunc as (value: TParserCallback) => IterableIterator<TParser | TFuncGen>)(callback);
         let nextParser = gen.next();
         while (nextParser.value !== undefined) {

             if (isGenerator(nextParser.value)) {
                let ret: ParseResult | ParseError = parse(callback, nextParser.value, s);
                if (ret.kind === "ParseResult" ) {
                    results.push(ret);
                    s = (ret as ParseResult).next;
                } else {
                    results.push(ret);
                    success = false;
                    break;
                }
                nextParser = gen.next((ret as ParseResult).value);

             } else {
                 let p = nextParser.value as TParser;
                 let ret: ParseResult | ParseError = p(s);
                 if (ret.kind === "ParseResult") {
                     results.push(ret);
                     s = (ret as ParseResult).next;
                 } else {
                     results.push(ret);
                     success = false;
                     break;
                 }
                 nextParser = gen.next((ret as ParseResult).value);
             }
         }
     } else {
         for (let i = 0; i < genFunc.length; i++) {
             let p = genFunc[i];
             if (s.EOF) {
                 break;
             }
             let ret: ParseResult | ParseError = p(s);
             if (ret.kind === "ParseResult") {
                 results.push(ret);
                 s =  (ret as ParseResult).next;
             } else {
                 results.push(ret);
                 success = false;
                 break;
             }
         }
     }
     parse_inception--;
     if (results.length > 0) {
         return results[results.length - 1];
     } else {
         return new ParseError(input, "Expected a result but got nothing", false);
     }

}