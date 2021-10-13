import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";


export const eof = (input: Stream) => {
    return new ParseResult(input.EOF, input, input, "");
}