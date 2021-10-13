import {TParser} from "../TParser";
import {Stream} from "../Stream";
import {ParseError} from "../ParseError";
import {ParseResult} from "../ParseResult";


export const quotedString: TParser = function (input: Stream) {
    //@ts-ignore
    if (input as string === "isGenerator") {
        return;
    }
    if (input.EOF) {
        return new ParseError(input, "a quoted string, got EOF instead.", false);
    }
    let value = "";
    let doubleOrSingleQuote, previousChar, character = "";
    let s = input;

    character = input.get();
    if (character === "'") {
        doubleOrSingleQuote = "'";
    } else if (character === '"') {
        doubleOrSingleQuote = '"';
    } else {
        return new ParseError(input, "a quoted string, got " + character + " instead.", false);
    }

    value += character;
    while (true) {
        s = s.next();
        if (s.EOF) {
            return new ParseError(input, "a quoted string, got EOF instead.", false);
        }
        previousChar = character;
        character = s.get();
        value += character;
        if ((doubleOrSingleQuote === "'" && character === "'") ||
            (doubleOrSingleQuote === '"' && character === '"') &&
            (previousChar !== "\\")) {
                return new ParseResult(value, s.next(), input, value);
        }

    }

}
