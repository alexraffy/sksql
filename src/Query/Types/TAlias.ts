import {TTable} from "./TTable";
import {TLiteral} from "./TLiteral";


export interface TAlias {
    kind: "TAlias";
    name: TTable | TLiteral | string;
    alias: TLiteral | string;
}