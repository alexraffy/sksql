import {Stream} from "./Stream";
import {TParser} from "./TParser";
import {ParseResult} from "./ParseResult";
import {ParseError} from "./ParseError";
import {isGeneratorFunction} from "./isGenerator";
import {TParserError} from "../API/TParserError";
import {TDebugInfo} from "../Query/Types/TDebugInfo";


export type TParserCallback = (name, value) => void;

export type TFuncGen = ((value: TParserCallback) => IterableIterator<TParser | TFuncGen>) | TParser[];

let parse_inception: number = 0;

export function parse(callback: TParserCallback,
                      genFunc: TFuncGen
                      , input: Stream): ParseResult | ParseError {
    let results: (ParseResult | ParseError)[] = [];
    let success: boolean = true;
    let s = input;
    let maxChar = 0;
    parse_inception++;

    let cursorPos = s.cursor;

     if (isGeneratorFunction(genFunc)) {
         let gen = (genFunc as (value: TParserCallback) => IterableIterator<TParser | TFuncGen>)(callback);
         let nextParser = gen.next();

         while (nextParser.value !== undefined) {
             if (s.cursor > maxChar) {
                 maxChar = s.cursor;
             }
             if (isGeneratorFunction(nextParser.value)) {
                let ret: ParseResult | ParseError = parse(callback, nextParser.value, s);
                if (ret.kind === "ParseResult" ) {
                    /*
                    if (typeof (ret as ParseResult).value === "object") {
                        ((ret as ParseResult).value as TDebugInfo).debug = {
                            start: cursorPos,
                            end: (ret as ParseResult).next.cursor
                        }
                    }

                     */
                    results.push(ret);
                    s = (ret as ParseResult).next;
                    //cursorPos = s.cursor;
                } else {
                    results.push(ret);
                    success = false;
                    break;
                }
                nextParser = gen.next((ret as ParseResult).value);

             } else {
                 let p = nextParser.value as TParser;
                 if (typeof p !== "function") {
                     throw new TParserError("Error at position " + s.cursor);
                 }
                 let ret: ParseResult | ParseError = p(s);
                 if (ret.kind === "ParseResult") {
                     /*
                     if (typeof (ret as ParseResult).value === "object") {
                         ((ret as ParseResult).value as TDebugInfo).debug = {
                             start: cursorPos,
                             end: (ret as ParseResult).next.cursor
                         }
                     }

                      */
                     results.push(ret);
                     s = (ret as ParseResult).next;
                     //cursorPos = s.cursor;
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
             //if (s.EOF) {
             //    break;
            // }
             let ret: ParseResult | ParseError = p(s);
             if (ret.kind === "ParseResult") {
                 /*
                 if (typeof (ret as ParseResult).value === "object") {
                     ((ret as ParseResult).value as TDebugInfo).debug = {
                         start: cursorPos,
                         end: (ret as ParseResult).next.cursor
                     }
                 }

                  */
                 results.push(ret);
                 s =  (ret as ParseResult).next;
                 //cursorPos = s.cursor;
             } else {
                 results.push(ret);
                 success = false;
                 break;
             }
         }
     }
     parse_inception--;
     if (results.length > 0) {
         let ret = results[results.length - 1];
         if (ret.kind === "ParseResult") {
             if (typeof (ret as ParseResult).value === "object") {
                 (ret as ParseResult).value.debug = {
                     start: cursorPos,
                     end: (ret as ParseResult).next.cursor
                 };

             }
         }
         return ret;
     } else {
         return new ParseError(input, "Expected a result but got nothing", false);
     }

}