import {DBData, DBInit} from "../API/DBInit";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {blockInfo} from "../Blocks/blockInfo";


export function readBlobRecord(table: ITable, tableDef: ITableDefinition, dv: DataView, offset: number) {

    const blobBlockId = dv.getUint32(offset);
    return blobBlockId;


}