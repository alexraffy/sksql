import {ITableData} from "./ITableData";
import {offs} from "../Blocks/kBlockHeaderField";

/*
    return the size of a row not accounting for row header
 */
export function recordSize(tb: ITableData) {

    if (tb.tableDef === undefined) {
        return 0;
    }
    let dv = new DataView(tb.tableDef);
    return dv.getUint32(offs().TableDefRowSize);
}