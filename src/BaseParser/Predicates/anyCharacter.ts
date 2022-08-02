import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";

// Consume any character

export const anyCharacter = (s: Stream): ParseResult | ParseError => {
    if (s.EOF === false) {
        let character = s.get();
        return new ParseResult(character, s.next(), s, character);
    } else {
        return new ParseError(s, "EOF", false);
    }
}