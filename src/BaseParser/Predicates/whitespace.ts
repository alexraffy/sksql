import {isDigit, isSpace} from "./types";
import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";

// try to parse a space

export const whitespace = (s: Stream): ParseResult | ParseError => {
    let character = s.get();
    if (isSpace(character)) {
        return new ParseResult(character, s.next(), s, character)
    }
    return new ParseError(s, "a whitespace", false);
}