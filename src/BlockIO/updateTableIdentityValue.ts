import {ITableData} from "../Table/ITableData";
import {ITable} from "../Table/ITable";
import {offs} from "../Blocks/kBlockHeaderField";

/*
    sets the last value of the identity in the table header
 */
export function updateTableIdentityValue(tbl: ITable, newValue: number) {
    if (tbl.data.tableDef === undefined) {
        return;
    }
    let dv = new DataView(tbl.data.tableDef);
    dv.setUint32(offs().TableDefIdentityValue, newValue);
    dv.setUint8(offs().BlockDirty, 1);
}