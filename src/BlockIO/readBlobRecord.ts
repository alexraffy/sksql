import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";



export function readBlobRecord(table: ITable, tableDef: ITableDefinition, dv: DataView, offset: number) {

    const blobBlockId = dv.getUint32(offset);
    return blobBlockId;


}