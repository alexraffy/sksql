import {BlockType} from "./BlockType";


export interface IBlockInfo {
    blockId: number;
    type: BlockType;
    start: number;
    end: number;
    rowId: number;
    numRows: number;
}