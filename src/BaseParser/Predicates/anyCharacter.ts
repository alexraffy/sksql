import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {isSpace} from "./types";


export const anyCharacter = (s: Stream): ParseResult | ParseError => {
    //@ts-ignore
    if (s as string === "isGenerator") {
        return;
    }
    let character = s.get();
    return new ParseResult(character, s.next(), s, character);
}