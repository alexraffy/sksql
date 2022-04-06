import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {isSpace} from "./types";

// try to parse a space, tab or new line

export const whitespaceOrNewLine = (s: Stream): ParseResult | ParseError => {
    if (s.EOF) {
        return new ParseError(s, "a whitespace", false);
    }
    let character = s.get();
    if (isSpace(character)) {
        return new ParseResult(character, s.next(), s, character);
    } else if (character === '\t') {
        return new ParseResult(character, s.next(), s, character);
    } else if (character === '\r') {
        let s2 = s.next();
        if (!s2.EOF && s2.get() === '\n') {
            return new ParseResult("\r\n", s2.next(), s, "\r\n");
        } else {
            return new ParseResult("\r", s2, s, "\r");
        }
    } else if (character === '\n') {
        return new ParseResult("\n", s.next(), s, character);
    }
    return new ParseError(s, "a whitespace", false);
}