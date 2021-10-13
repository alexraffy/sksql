import {isDigit, isSpace} from "./types";
import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";


export const whitespace = (s: Stream): ParseResult | ParseError => {
    //@ts-ignore
    if (s as string === "isGenerator") {
        return;
    }
    let character = s.get();
    if (isSpace(character)) {
        return new ParseResult(character, s.next(), s, character)
    }
    return new ParseError(s, "a whitespace", false);
}