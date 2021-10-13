import {ParseError} from "../ParseError";


export function instanceOfParseError(object: any): object is ParseError {
    return object !== undefined && object.kind === "ParseError";
}