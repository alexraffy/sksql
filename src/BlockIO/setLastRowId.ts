import {ITableData} from "../Table/ITableData";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";

/*
    set the last rowID in the table header
 */
export function setLastRowId(tb: ITableData, rowId: number) {
    if (tb.tableDef === undefined) {
        return;
    }
    let dv = new DataView(tb.tableDef);
    dv.setUint32(kBlockHeaderField.LastRowId, rowId);
}