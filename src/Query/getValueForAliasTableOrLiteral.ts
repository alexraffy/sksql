import {TAlias} from "./Types/TAlias";
import {TTable} from "./Types/TTable";
import {TLiteral} from "./Types/TLiteral";
import {instanceOfTAlias} from "./Guards/instanceOfTAlias";
import {instanceOfTLiteral} from "./Guards/instanceOfTLiteral";
import {instanceOfTTable} from "./Guards/instanceOfTTable";

export function getValueForLiteralOrString(s: TLiteral | string): string {
    if (typeof s === "string") {
        return s;
    }
    if (instanceOfTLiteral(s)) {
        return s.value;
    }
    throw "Unknown type passed to getValueForLiteralOrString";
}


export function getValueForAliasTableOrLiteral(s: string | TAlias | TTable | TLiteral): { alias: string, table: string} {
    if (typeof s === "string") {
        return { alias: s, table: s};
    }
    if (instanceOfTAlias(s)) {
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

}