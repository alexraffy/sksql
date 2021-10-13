import {ParseResult} from "../ParseResult";


export function instanceOfParseResult(object: any): object is ParseResult {
    return object !== undefined && object.kind === "ParseResult";
}