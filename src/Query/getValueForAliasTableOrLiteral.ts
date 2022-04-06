import {TAlias} from "./Types/TAlias";
import {TTable} from "./Types/TTable";
import {TLiteral} from "./Types/TLiteral";
import {instanceOfTAlias} from "./Guards/instanceOfTAlias";
import {instanceOfTLiteral} from "./Guards/instanceOfTLiteral";
import {instanceOfTTable} from "./Guards/instanceOfTTable";
import {TQuerySelect} from "./Types/TQuerySelect";
import {instanceOfTQuerySelect} from "./Guards/instanceOfTQuerySelect";
import {TParserError} from "../API/TParserError";

export function getValueForLiteralOrString(s: TLiteral | string): string {
    if (typeof s === "string") {
        return s;
    }
    if (instanceOfTLiteral(s)) {
        return s.value;
    }
    throw "Unknown type passed to getValueForLiteralOrString";
}


// extract the value from a TAlias/TTable/TLiteral

export function getValueForAliasTableOrLiteral(s: string | TAlias | TTable | TLiteral): { alias: string, table: string} {
    if (typeof s === "string") {
        return { alias: s, table: s};
    }
    if (instanceOfTAlias(s)) {
        if (instanceOfTQuerySelect(s.name)) {
            throw new TParserError("SUBQUERY UNEXPECTED");
        }
        return {
            alias: getValueForAliasTableOrLiteral(s.alias).alias,
            table: getValueForAliasTableOrLiteral(s.name).table
        };
    }
    if (instanceOfTLiteral(s)) {
        return {
            alias: s.value,
            table: s.value
        }
    }
    if (instanceOfTTable(s)) {
        return {
            alias: s.table,
            table: s.table
        }
    }
    if (instanceOfTQuerySelect(s)) {
        throw new TParserError("SUBQUERY UNEXPECTED");
    }

}