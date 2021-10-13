import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {Stream} from "../Stream";
import {isDigit} from "./types";


export const digit = (s: Stream): ParseResult | ParseError => {
    //@ts-ignore
    if (s as string === "isGenerator") {
        return;
    }
    if (!s.EOF) {
        let character = s.get();
        if (isDigit(character)) {
            return new ParseResult(character, s.next(), s, character)
        }
    }
    return new ParseError(s, "a digit", false);
}