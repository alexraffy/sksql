import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {TAlias} from "../Query/Types/TAlias";
import {TTable} from "../Query/Types/TTable";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";


export function findWalkTable(tables: TTableWalkInfo[], table: TTable | TAlias) {
    let val = getValueForAliasTableOrLiteral(table);
    let tbl = val.table.toUpperCase();
    let al = val.alias.toUpperCase();
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].alias.toUpperCase() === al && tables[i].alias !== "") {
            return tables[i];
        } else if (tables[i].name.toUpperCase() === tbl && al === "" || al === tables[i].name.toUpperCase()) {
            return tables[i];
        }
    }
    return undefined;
}