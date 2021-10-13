import {ParseResult} from "../ParseResult";
import {Stream} from "../Stream";
import {ParseError} from "../ParseError";
import {isAlphaNumeric, isLetter} from "./types";


export function literal(input: Stream): ParseResult | ParseError {
    //@ts-ignore
    if (input as string === "isGenerator") {
        return;
    }
    if (input.EOF) {
        return new ParseError(input, "a literal, got EOF instead.", false);
    }
    // first character is always a letter
    let value = "";
    let character = input.get();
    if (!isLetter(character)) {
        return new ParseError(input, "a character", false);
    }
    value += character;

    let s = input.next();
    if (!s.EOF) {
        character = s.get();
        while (isAlphaNumeric(character) || character === "_") {
            value += character;

            s = s.next();
            if (s.EOF) {
                break;
            }
            character = s.get();
        }
    }
    return new ParseResult(value, s, input, value);
}