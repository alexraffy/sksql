import {BlockType} from "./BlockType";

// struct about a block

export interface IBlockInfo {
    blockId: number;
    type: BlockType;
    start: number;
    end: number;
    rowId: number;
    numRows: number;
}