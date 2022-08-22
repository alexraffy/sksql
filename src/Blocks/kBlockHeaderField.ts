
/*
    This enum contains offset values of different fields in a block or table header

 */

import {ITableDefinition} from "../Table/ITableDefinition";

const BYTE = 1;
const INT16 = 2;
const INT32 = 4;
const INT64 = 8;
const BOOL = 1;

interface IOffset4Block {
    BlockType: number,
    BlockId: number,
    DataStart: number,
    DataEnd: number,
    LastRowId: number,
    NumRows: number,
    BlockDirty: number,
}


interface IOffset4Table {
    TableDefMagic: number,
    TableDefVersion: number,
    TableDefFlag1: number,
    TableDefFlag1_BitOK: number,
    TableDefFlag1_BitWriteLocked: number,
    TableDefFlag1_BitReadLocked: number,
    TableDefFlag2: number,
    TableDefFlag3: number,
    TableDefTableObjectId: number,
    TableDefTableName: number,
    TableDefHasIdentity: number,
    TableDefIdentitySeed: number,
    TableDefIdentityIncrement: number,
    TableDefIdentityValue: number,
    TableDefIdentityColumnName: number,
    TableDefNumColumns: number,
    TableDefRowSize: number,
    TableDefNumConstraints: number,
    TableDefNumIndices: number,
    TableDefColumnsStart: number,
    TableDefConstraintsStart: number,
    TableDefIndicesStart: number,
    TableDefColumnsStartDefault: number
}

interface IOffset4Row {
    TableDefColumnType: number,
    TableDefColumnFlag1: number,
    TableDefColumnFlag1Bit_Nullable: number,
    TableDefColumnFlag1Bit_HasDefaultExpression: number,
    TableDefColumnFlag2: number,
    TableDefColumnFlag2Bit_Invisible: number,
    TableDefColumnFlag3: number,
    TableDefColumnLength: number,
    TableDefColumnOffset: number,
    TableDefColumnName: number,
    TableDefColumnDefaultExpression: number,
    TableDefColumnEnd: number
}

interface IOffset4DataRowHeader {
    DataRowId: number,
    DataRowFlag: number,
    DataRowStart: number,
    DataRowFlag_BitNothing: number,
    DataRowFlag_BitDeleted: number,
    DataRowFlag_BitLocked: number,
}


export type IOffsetDefinitions = IOffset4Block & IOffset4Table & IOffset4Row & IOffset4Constraint & IOffset4DataRowHeader & IOffset4Index;


export interface IOffset4Constraint {
    TableDefConstraintType: number,
    TableDefConstraintIsClustered: number,
    TableDefConstraintNumberOfColumns: number,
    TableDefConstraintNumberOfForeignKeyColumns: number,
    TableDefConstraintForeignKeyOnUpdate: number,
    TableDefConstraintForeignKeyOnDelete: number,
    TableDefConstraintName: number,
    TableDefConstraintForeignKeyTableName: number,
    TableDefConstraintCheckExpression: number,
    TableDefConstraintEnd: number,
    TableDefConstraint_ColumnSort: number,
    TableDefConstraint_ColumnName: number,
    TableDefConstraint_ForeignKeyColumnName: number,
}

export interface IOffset4Index {
    IndexId: number,
    IndexType: number,
    IndexName: number,
    IndexColumnName: number,
    IndexDataStart: number
}

const cachedOffsetsV0: IOffsetDefinitions = initHeaderOffsets(0);
const cachedOffsetsV1: IOffsetDefinitions = initHeaderOffsets(1);

export function offs(): IOffsetDefinitions {
    return cachedOffsetsV1;
}

export function offsV0(): IOffsetDefinitions {
    return cachedOffsetsV0;
}


// calculate offset for table definition
function initHeaderOffsets(version = 0 | 1): IOffsetDefinitions {
    let counter = { offset: 0 };
    let data : { key: string, offset: number, size: number}[] = [];
    function add(key: string, size: number) {
        let oo: {
            key: string;
            offset: number;
            size: number;
        } = {
            key: key,
            offset: counter.offset,
            size: size
        };
        data.push(oo);
        counter.offset = counter.offset + size;
    }
    function move(offset: number) {
        counter.offset = offset;
    }

    move(0);
    add("BlockType", BYTE);
    add("BlockId", INT32);
    add("DataStart", INT32);
    add("DataEnd", INT32);
    add("LastRowId", INT32);
    add("NumRows", INT32);
    add("BlockDirty", BOOL);
    move(25);
    add("TableDefMagic", INT32);
    add("TableDefVersion", BYTE);
    add("TableDefFlag1", BYTE);
    add("TableDefFlag2", BYTE);
    add("TableDefFlag3", BYTE);
    if (version > 0) {
        add("TableDefTableObjectId", 36);
        add("TableDefTransactionId", 36);
        add("TableDefTransactionFlag", BYTE);
    }
    add("TableDefTableName", 255);
    add("TableDefReserved1", BYTE);
    add("TableDefReserved2", BYTE);
    add("TableDefHasIdentity", BOOL);
    add("TableDefIdentitySeed", INT32);
    add("TableDefIdentityIncrement", INT32);
    add("TableDefIdentityValue", INT32);
    add("TableDefReserved3", BYTE);
    add("TableDefReserved4", BYTE);
    add("TableDefIdentityColumnName", 255);
    add("TableDefNumColumns", INT32);
    add("TableDefRowSize", INT32);
    add("TableDefNumConstraints", INT32);
    add("TableDefNumIndices", INT32);
    add("TableDefColumnsStart", INT32);
    add("TableDefConstraintsStart", INT32);
    add("TableDefReserved5", BYTE);
    add("TableDefIndicesStart", INT32);
    add("TableDefReserved6", BYTE);
    add("TableDefReserved7", BYTE);
    add("TableDefReserved8", BYTE);
    add("TableDefReserved9", BYTE);
    add("TableDefReserved10", BYTE);
    add("TableDefReserved11", BYTE);
    add("TableDefReserved12", BYTE);
    add("TableDefReserved13", BYTE);
    add("TableDefReserved14", BYTE);
    add("TableDefReserved15", BYTE);
    add("TableDefReserved16", BYTE);
    add("TableDefColumnsStartDefault", INT32);

    move(0);
    add("TableDefFlag1_BitOK", BYTE);
    add("TableDefFlag1_BitWriteLocked", BYTE);
    add("TableDefFlag1_BitReadLocked", BYTE);

    move(0);
    add("TableDefColumnType", BYTE);
    add("TableDefColumnFlag1", BYTE);
    add("TableDefColumnFlag2", BYTE);
    add("TableDefColumnFlag3", BYTE);
    add("TableDefColumnLength", INT32);
    add("TableDefColumnOffset", INT32);
    add("TableDefColumnName", 255);
    add("TableDefColumnReserved1", BYTE);
    add("TableDefColumnDefaultExpression", 255);
    add("TableDefColumnReserved2", BYTE);
    if (version > 0) {
        add("TableDefColumnOtherTypeName", 255);
    }
    add("TableDefColumnEnd", BYTE);

    move(1);
    add("TableDefColumnFlag1Bit_Nullable", BYTE);
    add("TableDefColumnFlag1Bit_HasDefaultExpression", BYTE);

    move(1);
    add("TableDefColumnFlag2Bit_Invisible", BYTE);

    move(0);
    add("TableDefConstraintType", BYTE);
    add("TableDefConstraintIsClustered", BOOL);
    add("TableDefConstraintNumberOfColumns", BYTE);
    add("TableDefConstraintNumberOfForeignKeyColumns", BYTE);
    add("TableDefConstraintForeignKeyOnUpdate", BYTE);
    add("TableDefConstraintForeignKeyOnDelete", BYTE);
    add("TableDefConstraintName", 255);
    add("TableDefConstraintReserved1", BYTE);
    add("TableDefConstraintForeignKeyTableName", 255);
    add("TableDefConstraintReserved2", BYTE);
    add("TableDefConstraintCheckExpression", 255);
    add("TableDefConstraintReserved3", BYTE);
    add("TableDefConstraintEnd", BYTE);

    move(0);
    add("DataRowId", INT32);
    add("DataRowFlag", BYTE);
    add("DataRowStart", 0);

    move(0);
    add("DataRowFlag_BitNothing", BYTE);
    add("DataRowFlag_BitDeleted", BYTE);
    add("DataRowFlag_BitLocked", BYTE);

    move(0);
    add("TableDefConstraint_ColumnSort", BYTE);
    add("TableDefConstraint_ColumnName", BYTE);
    move(0);
    add("TableDefConstraint_ForeignKeyColumnName", BYTE);

    move(25);
    add("IndexId", INT32);
    add("IndexType", BYTE);
    add("IndexFlag1", BYTE);
    add("IndexFlag2", BYTE);
    add("IndexFlag3", BYTE);
    add("IndexFlag4", BYTE);
    add("IndexObjectId", 36);
    add("IndexTransactionId", 36);
    add("IndexTransactionFlag", BYTE);
    add("IndexName", 255);
    add("IndexRefTable", 255);
    add("IndexNumColumns", BYTE);
    add("IndexExpression", 255);
    add("IndexDataStart", INT32);
    add("IndexColumnsDefStart", BYTE);


    move(0);
    add("IndexColumnType", BYTE);
    add("IndexColumnName", 255);
    add("IndexColumnDefEnd", BYTE);



    let ret: {key: number}[] = [];
    for (let i = 0; i < data.length; i++) {
        ret[data[i].key] = data[i].offset;
    }

    return ret as unknown as IOffsetDefinitions;
}



export enum kBlockHeaderFieldV0 {
    BlockType = 0,
    BlockId= 1,
    DataStart = 5,
    DataEnd = 9,
    LastRowId = 13,
    NumRows = 17,
    BlockDirty = 21,

    // Table description
    TableDefMagic = 25,
    TableDefVersion = 29,
    TableDefFlag1 = 30,
    TableDefFlag1_BitOK = 0,
    TableDefFlag1_BitWriteLocked = 1,
    TableDefFlag1_BitReadLocked = 2,


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
    TableDefColumnFlag1Bit_Nullable = 1,
    TableDefColumnFlag1Bit_HasDefaultExpression = 2,
    TableDefColumnFlag2 = 2,
    TableDefColumnFlag2Bit_Invisible = 1,
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

    DataRowFlag_BitNothing = 0,
    DataRowFlag_BitDeleted = 1,
    DataRowFlag_BitLocked = 2,

    // For index
    IndexId = 25,
    IndexType = 29,
    IndexName = 30,
    IndexColumnName = 80,
    IndexDataStart = 130


}
