import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {Stream} from "../Stream";
import {isAlphaNumeric, isLetter} from "./types";


export function str(equalsTo: string): (input: Stream) => ParseResult | ParseError {
    return (input: Stream): ParseResult | ParseError => {
        //@ts-ignore
        if (input as string === "isGenerator") {
            return;
        }
        if (input.EOF) {
            return new ParseError(input, equalsTo  + " got EOF instead.", false);
        }
        equalsTo = equalsTo.toUpperCase();

        let value = "";
        let character = input.get().toUpperCase();
        let idx = 0;
        let s = input;
        while (character === equalsTo[idx]) {
            value += character;

            s = s.next();
            if (s.EOF) {
                break;
            }
            idx++;
            character = s.get().toUpperCase();
        }
        if (value === equalsTo) {
            return new ParseResult(value, s, input, value);
        } else {
            return new ParseError(input, equalsTo + " got " + value + " instead", false);
        }
    }
}