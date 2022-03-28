import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";


export const isEOF = (input: Stream) => {
    return new ParseResult(input.EOF, input, input, "");
}


export const eof = (input: Stream) => {
    if (input.EOF) {
        return new ParseResult(true, input, input, "");
    } else {
        return new ParseError(input, "EOF not reached", false);
    }
}
