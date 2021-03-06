import {TParser} from "../TParser";
import {parse} from "../parse";
import {Stream} from "../Stream";
import {ParseResult} from "../ParseResult";
import {ParseError} from "../ParseError";
import {oneOf} from "./oneOf";

// try to parse p1, then p2 if p1 fails.
export function either(p1: TParser, p2?: TParser) {
    return oneOf([p1, p2], "");
}