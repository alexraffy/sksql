import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";

// returns true if we have reached the end of the stream
export const isEOF = (input: Stream) => {
    return new ParseResult(input.EOF, input, input, "");
}

// returns a positive result if we have reached the end of stream
export const eof = (input: Stream) => {
    if (input.EOF) {
        return new ParseResult(true, input, input, "");
    } else {
        return new ParseError(input, "EOF not reached", false);
    }
}
