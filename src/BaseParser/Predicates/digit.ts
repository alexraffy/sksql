import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {Stream} from "../Stream";
import {isDigit} from "./types";

// consume a digit

export const digit = (s: Stream): ParseResult | ParseError => {
    if (!s.EOF) {
        let character = s.get();
        if (isDigit(character)) {
            return new ParseResult(character, s.next(), s, character)
        }
    }
    return new ParseError(s, "a digit", false);
}