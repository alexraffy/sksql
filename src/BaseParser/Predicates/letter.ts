import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {isLetter} from "./types";

// consume a letter

export const letter = (s: Stream): ParseResult | ParseError => {
    if (!s.EOF) {
        let character = s.get();
        if (isLetter(character)) {
            return new ParseResult(character, s.next(), s, character)
        }
    }
    return new ParseError(s, "a letter", false);
}