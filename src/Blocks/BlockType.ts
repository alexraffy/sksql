
/*
    What kind of data is stored in the block
    tableDefinition is used to store table info like columns, keys and indices
    rows for data
 */
export enum BlockType {
    tableDefinition = 0,
    rows = 1,
    index = 2,
    blobData = 3,
    hashMap = 4
}
