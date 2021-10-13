import {ITable} from "../Table/ITable";
import {newBlock} from "../Blocks/newBlock";
import {BlockType} from "../Blocks/BlockType";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {copyBytesToSharedBuffer} from "./copyBytesToSharedBuffer";

/*
    write the blob value to a new block
 */
export function writeBlob(table: ITable, blobRecord: DataView, blobData: ArrayBuffer) {
    let size = blobData.byteLength + 25;
    let id = table.data.blocks.length + 1
    let blk = newBlock(size, BlockType.blobData, id);
    let dvBlk = new DataView(blk, 0, size);
    copyBytesToSharedBuffer(blobData, dvBlk, 0, kBlockHeaderField.DataStart);
    dvBlk.setUint32(kBlockHeaderField.DataEnd, size - 25)

    table.data.blocks.push(blk);
    // update the blobRecord
    blobRecord.setUint32(0, id);




}