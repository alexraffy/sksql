import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";


// Consume a new line

export const newLine = (s: Stream): ParseResult | ParseError => {
    let character = s.get();
    if (character === '\r') {
        let s2 = s.next();
        if (!s2.EOF && s2.get() === '\n') {
            return new ParseResult("\r\n", s2.next(), s, "\r\n");
        } else {
            return new ParseResult("\r", s2, s, "\r");
        }
    } else if (character === '\n') {
        return new ParseResult("\n", s.next(), s, character);
    }
    return new ParseError(s, "a newline", false);
}