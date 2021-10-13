import {ITableDefinition} from "./ITableDefinition";


export function headerLengthForTableDefinition(t: ITableDefinition) {
    let ret = 255; // name
    ret += 4; // num columns
    ret += 4; // row size
    ret += 4; // num indices
    ret += 4; // columns start
    ret += 4; // indices start
    // foreach columns: type, flag1, flag2, flag3, length, offset, name
    ret += (1 + 1 + 1 + 1 + 4 + 4 + 255) * t.columns.length
    return ret;
}