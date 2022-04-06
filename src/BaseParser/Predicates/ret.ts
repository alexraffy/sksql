import {ParseResult} from "../ParseResult";
import {Stream} from "../Stream";

// return a struct to the AST tree

export const returnPred = (value: any) => {
    return (input: Stream) => {
        return new ParseResult(value, input, input, "");
    }
}