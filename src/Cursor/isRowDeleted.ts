import {ITableCursor} from "./ITableCursor";
import {ITableData} from "../Table/ITableData";
import {offs} from "../Blocks/kBlockHeaderField";

// Read the header of a row and returns true if the row is marked as deleted.

export function isRowDeleted(tableData: ITableData, cursor: ITableCursor) {
    let dv = new DataView(tableData.blocks[cursor.blockIndex], cursor.offset, 5);
    let flag = dv.getUint8(offs().DataRowFlag);
    return ((flag & offs().DataRowFlag_BitDeleted) === offs().DataRowFlag_BitDeleted) ? true : false;
}