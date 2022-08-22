import {ITableData} from "../Table/ITableData";
import {offs} from "../Blocks/kBlockHeaderField";

/*
    set the last rowID in the table header
 */
export function setLastRowId(tb: ITableData, rowId: number) {
    if (tb.tableDef === undefined) {
        return;
    }
    let dv = new DataView(tb.tableDef);
    dv.setUint32(offs().LastRowId, rowId);
}