
/*
    This enum contains offsets value of different fields in a block or table header

 */
export enum kBlockHeaderField {
    BlockType = 0,
    BlockId= 1,
    DataStart = 5,
    DataEnd = 9,
    LastRowId = 13,
    NumRows = 17,
    // Table description
    TableDefMagic = 25,
    TableDefVersion = 29,
    TableDefFlag1 = 30,
    TableDefFlag2 = 31,
    TableDefFlag3 = 32,
    TableDefTableName = 33,
    TableDefHasIdentity = 290,
    TableDefIdentitySeed = 291,
    TableDefIdentityIncrement = 295,
    TableDefIdentityValue = 299,
    TableDefIdentityColumnName = 305,
    TableDefNumColumns = 560,
    TableDefRowSize = 564,
    TableDefNumConstraints = 568,
    TableDefNumIndices = 572,
    TableDefColumnsStart = 576,
    TableDefConstraintsStart = 580,
    TableDefIndicesStart = 585,
    TableDefColumnsStartDefault = 600,

    // Column definition offsets
    TableDefColumnType = 0,
    TableDefColumnFlag1 = 1,
    TableDefColumnFlag1Bit_Nullable = 7,
    TableDefColumnFlag1Bit_HasDefaultExpression = 6,
    TableDefColumnFlag2 = 2,
    TableDefColumnFlag3 = 3,
    TableDefColumnLength = 4,
    TableDefColumnOffset = 8,
    TableDefColumnName = 12,
    TableDefColumnDefaultExpression = 268,
    TableDefColumnEnd = 524,
    // Table constraints offsets
    TableDefConstraintType = 0,
    TableDefConstraintIsClustered = 1,
    TableDefConstraintNumberOfColumns = 2,
    TableDefConstraintNumberOfForeignKeyColumns = 3,
    TableDefConstraintForeignKeyOnUpdate = 4,
    TableDefConstraintForeignKeyOnDelete = 5,
    TableDefConstraintName = 6,
    TableDefConstraintForeignKeyTableName = 262,
    TableDefConstraintCheckExpression = 518,
    TableDefConstraintEnd = 774,
    TableDefConstraint_ColumnSort = 0,
    TableDefConstraint_ColumnName = 1,
    TableDefConstraint_ForeignKeyColumnName = 0,


    // For Data Row
    DataRowId = 0,
    DataRowFlag = 4,
    DataRowStart = 5,
    // For index
    IndexId = 25,
    IndexType = 29,
    IndexName = 30,
    IndexColumnName = 80,
    IndexDataStart = 130


}
