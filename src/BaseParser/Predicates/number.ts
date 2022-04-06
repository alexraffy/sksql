import {ParseError} from "../ParseError";
import {isAlphaNumeric, isDigit, isLetter} from "./types";
import {ParseResult} from "../ParseResult";
import {Stream} from "../Stream";


// parse a signed number, with a decimal point "."

export function number(input: Stream): ParseResult | ParseError {
    if (input.EOF) {
        return new ParseError(input, "a literal, got EOF instead.", false);
    }
    let value = "";
    let character = input.get();
    if (!((character === "-") || isDigit(character))) {
        return new ParseError(input, "a character", false);
    }
    value += character;

    let s = input.next();
    if (!s.EOF) {
        character = s.get();
        while (isDigit(character) || character === ".") {
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