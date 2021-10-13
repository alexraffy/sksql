import {TLiteral} from "../Types/TLiteral";


export function instanceOfTLiteral(object: any): object is TLiteral {
    return object !== undefined && object.kind === "TLiteral";
}