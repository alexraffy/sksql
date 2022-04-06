import {blockInfo} from "../Blocks/blockInfo";
import {ITable} from "../Table/ITable";

// Read a blob buffer from a block

export function getBlobValue(table: ITable, blockId: number): DataView {
    for (let i = 0; i < table.data.blocks.length; i++) {
        const b = blockInfo(table.data.blocks[i]);
        if (b.blockId === blockId) {
            return new DataView(table.data.blocks[i],
                b.start, b.end - b.start);
        }
    }
    return undefined;
}