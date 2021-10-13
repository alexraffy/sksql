import {ParseResult} from "../ParseResult";
import {Stream} from "../Stream";


export const returnPred = (value: any) => {
    return (input: Stream) => {
        return new ParseResult(value, input, input, "");
    }
}