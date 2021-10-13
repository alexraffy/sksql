import {ITableData} from "../Table/ITableData";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";

/*
    last rowID according to the table header
 */
export function getLastRowId(tb: ITableData) {
    if (tb.tableDef === undefined) {
        return 0;
    }
    let dv = new DataView(tb.tableDef);
    return dv.getUint32(kBlockHeaderField.LastRowId);
}