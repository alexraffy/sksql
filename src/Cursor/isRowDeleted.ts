import {ITableCursor} from "./ITableCursor";
import {ITableData} from "../Table/ITableData";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";


export function isRowDeleted(tableData: ITableData, cursor: ITableCursor) {
    let gotRecord: boolean = true;

    let dv = new DataView(tableData.blocks[cursor.blockIndex], cursor.offset, 5);
    let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
    return ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? true : false;


}