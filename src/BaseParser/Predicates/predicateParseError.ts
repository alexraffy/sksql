import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";


export function predicateParseError(equalsTo: string): (input: Stream) => ParseResult | ParseError {
    return (input: Stream): ParseResult | ParseError => {
        if (input.EOF) {
            return new ParseError(input, equalsTo + " got EOF instead.", false);
        }
        equalsTo = equalsTo.toUpperCase();

        let value = "";
        let character = input.get().toUpperCase();
        let idx = 0;
        let s = input;
        while (character !== " ") {
            value += character;

            s = s.next();
            if (s.EOF) {
                break;
            }
            idx++;
            character = s.get().toUpperCase();
        }
        return new ParseError(input, equalsTo + " GOT " + value + " INSTEAD", false);
    }
}