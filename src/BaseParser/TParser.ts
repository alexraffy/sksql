import {ParseResult} from "./ParseResult";
import {ParseError} from "./ParseError";
import {Stream} from "./Stream";


export type TParser = (input: Stream) => ParseResult | ParseError;
