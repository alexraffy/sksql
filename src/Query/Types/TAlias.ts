import {TTable} from "./TTable";
import {TLiteral} from "./TLiteral";
import {TQuerySelect} from "./TQuerySelect";


export interface TAlias {
    kind: "TAlias";
    name: TTable | TLiteral | TQuerySelect | string;
    alias: TLiteral | string;
}