import {kBlockHeaderFieldV0, offsV0, readStringFromUtf8Array, SKSQL, readTableDefinition, ITable, writeStringToUtf8ByteArray, newTable, ITableDefinition, generateV4UUID, TableColumnType} from "sksql";
import {checkNoTempTables} from "./runTest";
import * as assert from "assert";



export function blocks1(db: SKSQL, next:()=>void) {
    console.log("TESTING BLOCKS...");

    let ab = new ArrayBuffer(50);
    let dv = new DataView(ab, 0, 50);
    for (let i = 0; i < 50; i++) {
        dv.setUint8(i, 255);
    }
    writeStringToUtf8ByteArray(dv, 0, "Hello", 50);
    let str = readStringFromUtf8Array(dv, 0, -1);
    assert((str.length === 5 && str === "Hello"), "Writing/Reading to AB failed.");
    assert(kBlockHeaderFieldV0.BlockType === offsV0().BlockType, "BlockType" + " should be " + kBlockHeaderFieldV0.BlockType + " but is " + offsV0().BlockType)
    assert(kBlockHeaderFieldV0.BlockId === offsV0().BlockId, "BlockId")

    assert(kBlockHeaderFieldV0.DataStart === offsV0().DataStart, "DataStart" + " should be " + kBlockHeaderFieldV0.DataStart + " but is " + offsV0().DataStart)
    assert(kBlockHeaderFieldV0.DataEnd === offsV0().DataEnd, "DataEnd" + " should be " + kBlockHeaderFieldV0.DataEnd + " but is " + offsV0().DataEnd)
    assert(kBlockHeaderFieldV0.LastRowId === offsV0().LastRowId, "LastRowId" + " should be " + kBlockHeaderFieldV0.LastRowId + " but is " + offsV0().LastRowId)
    assert(kBlockHeaderFieldV0.NumRows === offsV0().NumRows, "NumRows" + " should be " + kBlockHeaderFieldV0.NumRows + " but is " + offsV0().NumRows)
    assert(kBlockHeaderFieldV0.BlockDirty === offsV0().BlockDirty, "BlockDirty" + " should be " + kBlockHeaderFieldV0.BlockDirty + " but is " + offsV0().BlockDirty)
    assert(kBlockHeaderFieldV0.TableDefVersion === offsV0().TableDefVersion, "TableDefVersion" + " should be " + kBlockHeaderFieldV0.TableDefVersion + " but is " + offsV0().TableDefVersion)
    assert(kBlockHeaderFieldV0.TableDefMagic === offsV0().TableDefMagic, "TableDefMagic" + " should be " + kBlockHeaderFieldV0.TableDefMagic + " but is " + offsV0().TableDefMagic)
    assert(kBlockHeaderFieldV0.TableDefFlag1_BitOK === offsV0().TableDefFlag1_BitOK, "TableDefFlag1_BitOK" + " should be " + kBlockHeaderFieldV0.TableDefFlag1_BitOK + " but is " + offsV0().TableDefFlag1_BitOK)
    assert(kBlockHeaderFieldV0.TableDefFlag1 === offsV0().TableDefFlag1, "TableDefFlag1")
    assert(kBlockHeaderFieldV0.TableDefFlag1_BitWriteLocked === offsV0().TableDefFlag1_BitWriteLocked, "TableDefFlag1_BitWriteLocked" + " should be " + kBlockHeaderFieldV0.TableDefFlag1_BitWriteLocked + " but is " + offsV0().TableDefFlag1_BitWriteLocked)
    assert(kBlockHeaderFieldV0.TableDefFlag1_BitReadLocked === offsV0().TableDefFlag1_BitReadLocked, "TableDefFlag1_BitReadLocked" + " should be " + kBlockHeaderFieldV0.TableDefFlag1_BitReadLocked + " but is " + offsV0().TableDefFlag1_BitReadLocked)
    assert(kBlockHeaderFieldV0.TableDefFlag2 === offsV0().TableDefFlag2, "TableDefFlag2" + " should be " + kBlockHeaderFieldV0.TableDefFlag2 + " but is " + offsV0().TableDefFlag2)
    assert(kBlockHeaderFieldV0.TableDefTableName === offsV0().TableDefTableName, "TableDefTableName")
    assert(kBlockHeaderFieldV0.TableDefFlag3 === offsV0().TableDefFlag3, "TableDefFlag3")
    assert(kBlockHeaderFieldV0.TableDefHasIdentity === offsV0().TableDefHasIdentity, "TableDefHasIdentity" + " should be " + kBlockHeaderFieldV0.TableDefHasIdentity + " but is " + offsV0().TableDefHasIdentity)
    assert(kBlockHeaderFieldV0.TableDefIdentitySeed === offsV0().TableDefIdentitySeed, "TableDefIdentitySeed" + " should be " + kBlockHeaderFieldV0.TableDefIdentitySeed + " but is " + offsV0().TableDefIdentitySeed)
    assert(kBlockHeaderFieldV0.TableDefIdentityIncrement === offsV0().TableDefIdentityIncrement, "TableDefIdentityIncrement" + " should be " + kBlockHeaderFieldV0.TableDefIdentityIncrement + " but is " + offsV0().TableDefIdentityIncrement)
    assert(kBlockHeaderFieldV0.TableDefIdentityValue === offsV0().TableDefIdentityValue, "TableDefIdentityValue" + " should be " + kBlockHeaderFieldV0.TableDefIdentityValue + " but is " + offsV0().TableDefIdentityValue)
    assert(kBlockHeaderFieldV0.TableDefIdentityColumnName === offsV0().TableDefIdentityColumnName, "TableDefIdentityColumnName" + " should be " + kBlockHeaderFieldV0.TableDefIdentityColumnName + " but is " + offsV0().TableDefIdentityColumnName)
    assert(kBlockHeaderFieldV0.TableDefNumColumns === offsV0().TableDefNumColumns, "TableDefNumColumns" + " should be " + kBlockHeaderFieldV0.TableDefNumColumns + " but is " + offsV0().TableDefNumColumns)
    assert(kBlockHeaderFieldV0.TableDefRowSize === offsV0().TableDefRowSize, "TableDefRowSize" + " should be " + kBlockHeaderFieldV0.TableDefRowSize + " but is " + offsV0().TableDefRowSize)
    assert(kBlockHeaderFieldV0.TableDefNumConstraints === offsV0().TableDefNumConstraints, "TableDefNumConstraints" + " should be " + kBlockHeaderFieldV0.TableDefNumConstraints + " but is " + offsV0().TableDefNumConstraints)
    assert(kBlockHeaderFieldV0.TableDefNumIndices === offsV0().TableDefNumIndices, "TableDefNumIndices" + " should be " + kBlockHeaderFieldV0.TableDefNumIndices + " but is " + offsV0().TableDefNumIndices)
    assert(kBlockHeaderFieldV0.TableDefColumnsStart === offsV0().TableDefColumnsStart, "TableDefColumnsStart" + " should be " + kBlockHeaderFieldV0.TableDefColumnsStart + " but is " + offsV0().TableDefColumnsStart)
    assert(kBlockHeaderFieldV0.TableDefConstraintsStart === offsV0().TableDefConstraintsStart, "TableDefConstraintsStart" + " should be " + kBlockHeaderFieldV0.TableDefConstraintsStart + " but is " + offsV0().TableDefConstraintsStart)
    assert(kBlockHeaderFieldV0.TableDefIndicesStart === offsV0().TableDefIndicesStart, "TableDefIndicesStart" + " should be " + kBlockHeaderFieldV0.TableDefIndicesStart + " but is " + offsV0().TableDefIndicesStart)
    assert(kBlockHeaderFieldV0.TableDefColumnsStartDefault === offsV0().TableDefColumnsStartDefault, "TableDefColumnsStartDefault" + " should be " + kBlockHeaderFieldV0.TableDefColumnsStartDefault + " but is " + offsV0().TableDefColumnsStartDefault)
    assert(kBlockHeaderFieldV0.TableDefColumnType === offsV0().TableDefColumnType, "TableDefColumnType" + " should be " + kBlockHeaderFieldV0.TableDefColumnType + " but is " + offsV0().TableDefColumnType)
    assert(kBlockHeaderFieldV0.TableDefColumnFlag1 === offsV0().TableDefColumnFlag1, "TableDefColumnFlag1" + " should be " + kBlockHeaderFieldV0.TableDefColumnFlag1 + " but is " + offsV0().TableDefColumnFlag1)
    assert(kBlockHeaderFieldV0.TableDefColumnFlag1Bit_Nullable === offsV0().TableDefColumnFlag1Bit_Nullable, "TableDefColumnFlag1Bit_Nullable" + " should be " + kBlockHeaderFieldV0.TableDefColumnFlag1Bit_Nullable + " but is " + offsV0().TableDefColumnFlag1Bit_Nullable)
    assert(kBlockHeaderFieldV0.TableDefColumnFlag1Bit_HasDefaultExpression === offsV0().TableDefColumnFlag1Bit_HasDefaultExpression, "TableDefColumnFlag1Bit_HasDefaultExpression" + " should be " + kBlockHeaderFieldV0.TableDefColumnFlag1Bit_HasDefaultExpression + " but is " + offsV0().TableDefColumnFlag1Bit_HasDefaultExpression)
    assert(kBlockHeaderFieldV0.TableDefColumnFlag2 === offsV0().TableDefColumnFlag2, "TableDefColumnFlag2" + " should be " + kBlockHeaderFieldV0.TableDefColumnFlag2 + " but is " + offsV0().TableDefColumnFlag2)
    assert(kBlockHeaderFieldV0.TableDefColumnFlag2Bit_Invisible === offsV0().TableDefColumnFlag2Bit_Invisible, "TableDefColumnFlag2Bit_Invisible" + " should be " + kBlockHeaderFieldV0.TableDefColumnFlag2Bit_Invisible + " but is " + offsV0().TableDefColumnFlag2Bit_Invisible)
    assert(kBlockHeaderFieldV0.TableDefColumnFlag3 === offsV0().TableDefColumnFlag3, "TableDefColumnFlag3" + " should be " + kBlockHeaderFieldV0.TableDefColumnFlag3 + " but is " + offsV0().TableDefColumnFlag3)
    assert(kBlockHeaderFieldV0.TableDefColumnLength === offsV0().TableDefColumnLength, "TableDefColumnLength" + " should be " + kBlockHeaderFieldV0.TableDefColumnLength + " but is " + offsV0().TableDefColumnLength)
    assert(kBlockHeaderFieldV0.TableDefColumnOffset === offsV0().TableDefColumnOffset, "TableDefColumnOffset" + " should be " + kBlockHeaderFieldV0.TableDefColumnOffset + " but is " + offsV0().TableDefColumnOffset)
    assert(kBlockHeaderFieldV0.TableDefColumnName === offsV0().TableDefColumnName, "TableDefColumnName" + " should be " + kBlockHeaderFieldV0.TableDefColumnName + " but is " + offsV0().TableDefColumnName)
    assert(kBlockHeaderFieldV0.TableDefColumnDefaultExpression === offsV0().TableDefColumnDefaultExpression, "TableDefColumnDefaultExpression" + " should be " + kBlockHeaderFieldV0.TableDefColumnDefaultExpression + " but is " + offsV0().TableDefColumnDefaultExpression)
    assert(kBlockHeaderFieldV0.TableDefColumnEnd === offsV0().TableDefColumnEnd, "TableDefColumnEnd" + " should be " + kBlockHeaderFieldV0.TableDefColumnEnd + " but is " + offsV0().TableDefColumnEnd)
    assert(kBlockHeaderFieldV0.TableDefConstraintType === offsV0().TableDefConstraintType, "TableDefConstraintType" + " should be " + kBlockHeaderFieldV0.TableDefConstraintType + " but is " + offsV0().TableDefConstraintType)
    assert(kBlockHeaderFieldV0.TableDefConstraintIsClustered === offsV0().TableDefConstraintIsClustered, "TableDefConstraintIsClustered" + " should be " + kBlockHeaderFieldV0.TableDefConstraintIsClustered + " but is " + offsV0().TableDefConstraintIsClustered)
    assert(kBlockHeaderFieldV0.TableDefConstraintNumberOfColumns === offsV0().TableDefConstraintNumberOfColumns, "TableDefConstraintNumberOfColumns" + " should be " + kBlockHeaderFieldV0.TableDefConstraintNumberOfColumns + " but is " + offsV0().TableDefConstraintNumberOfColumns)
    assert(kBlockHeaderFieldV0.TableDefConstraintNumberOfForeignKeyColumns === offsV0().TableDefConstraintNumberOfForeignKeyColumns, "TableDefConstraintNumberOfForeignKeyColumns" + " should be " + kBlockHeaderFieldV0.TableDefConstraintNumberOfForeignKeyColumns + " but is " + offsV0().TableDefConstraintNumberOfForeignKeyColumns)
    assert(kBlockHeaderFieldV0.TableDefConstraintForeignKeyOnUpdate === offsV0().TableDefConstraintForeignKeyOnUpdate, "TableDefConstraintForeignKeyOnUpdate" + " should be " + kBlockHeaderFieldV0.TableDefConstraintForeignKeyOnUpdate + " but is " + offsV0().TableDefConstraintForeignKeyOnUpdate)
    assert(kBlockHeaderFieldV0.TableDefConstraintForeignKeyOnDelete === offsV0().TableDefConstraintForeignKeyOnDelete, "TableDefConstraintForeignKeyOnDelete" + " should be " + kBlockHeaderFieldV0.TableDefConstraintForeignKeyOnDelete + " but is " + offsV0().TableDefConstraintForeignKeyOnDelete)
    assert(kBlockHeaderFieldV0.TableDefConstraintName === offsV0().TableDefConstraintName, "TableDefConstraintName" + " should be " + kBlockHeaderFieldV0.TableDefConstraintName + " but is " + offsV0().TableDefConstraintName)
    assert(kBlockHeaderFieldV0.TableDefConstraintForeignKeyTableName === offsV0().TableDefConstraintForeignKeyTableName, "TableDefConstraintForeignKeyTableName" + " should be " + kBlockHeaderFieldV0.TableDefConstraintForeignKeyTableName + " but is " + offsV0().TableDefConstraintForeignKeyTableName)
    assert(kBlockHeaderFieldV0.TableDefConstraintCheckExpression === offsV0().TableDefConstraintCheckExpression, "TableDefConstraintCheckExpression" + " should be " + kBlockHeaderFieldV0.TableDefConstraintCheckExpression + " but is " + offsV0().TableDefConstraintCheckExpression)
    assert(kBlockHeaderFieldV0.TableDefConstraintEnd === offsV0().TableDefConstraintEnd, "TableDefConstraintEnd" + " should be " + kBlockHeaderFieldV0.TableDefConstraintEnd + " but is " + offsV0().TableDefConstraintEnd)
    assert(kBlockHeaderFieldV0.TableDefConstraint_ColumnSort === offsV0().TableDefConstraint_ColumnSort, "TableDefConstraint_ColumnSort" + " should be " + kBlockHeaderFieldV0.TableDefConstraint_ColumnSort + " but is " + offsV0().TableDefConstraint_ColumnSort)
    assert(kBlockHeaderFieldV0.TableDefConstraint_ColumnName === offsV0().TableDefConstraint_ColumnName, "TableDefConstraint_ColumnName" + " should be " + kBlockHeaderFieldV0.TableDefConstraint_ColumnName + " but is " + offsV0().TableDefConstraint_ColumnName)
    assert(kBlockHeaderFieldV0.TableDefConstraint_ForeignKeyColumnName === offsV0().TableDefConstraint_ForeignKeyColumnName, "TableDefConstraint_ForeignKeyColumnName" + " should be " + kBlockHeaderFieldV0.TableDefConstraint_ForeignKeyColumnName + " but is " + offsV0().TableDefConstraint_ForeignKeyColumnName)
    assert(kBlockHeaderFieldV0.DataRowId === offsV0().DataRowId, "DataRowId" + " should be " + kBlockHeaderFieldV0.DataRowId + " but is " + offsV0().DataRowId)
    assert(kBlockHeaderFieldV0.DataRowFlag === offsV0().DataRowFlag, "DataRowFlag")
    assert(kBlockHeaderFieldV0.DataRowFlag_BitNothing === offsV0().DataRowFlag_BitNothing, "DataRowFlag_BitNothing" + " should be " + kBlockHeaderFieldV0.DataRowFlag_BitNothing + " but is " + offsV0().DataRowFlag_BitNothing)
    assert(kBlockHeaderFieldV0.DataRowStart === offsV0().DataRowStart, "DataRowStart" + " should be " + kBlockHeaderFieldV0.DataRowStart + " but is " + offsV0().DataRowStart)
    assert(kBlockHeaderFieldV0.DataRowFlag_BitDeleted === offsV0().DataRowFlag_BitDeleted, "DataRowFlag_BitDeleted" + " should be " + kBlockHeaderFieldV0.DataRowFlag_BitDeleted + " but is " + offsV0().DataRowFlag_BitDeleted)
    assert(kBlockHeaderFieldV0.DataRowFlag_BitLocked === offsV0().DataRowFlag_BitLocked, "DataRowFlag_BitLocked" + " should be " + kBlockHeaderFieldV0.DataRowFlag_BitLocked + " but is " + offsV0().DataRowFlag_BitLocked)
    assert(kBlockHeaderFieldV0.IndexId === offsV0().IndexId, "IndexId" + " should be " + kBlockHeaderFieldV0.IndexId + " but is " + offsV0().IndexId)
    assert(kBlockHeaderFieldV0.IndexType === offsV0().IndexType, "IndexType")
    /*
    assert(kBlockHeaderFieldV0.IndexColumnName === offsV0().IndexColumnName, "IndexColumnName" + " should be " + kBlockHeaderFieldV0.IndexColumnName + " but is " + offsV0().IndexColumnName)
    assert(kBlockHeaderFieldV0.IndexName === offsV0().IndexName, "IndexName" + " should be " + kBlockHeaderFieldV0.IndexName + " but is " + offsV0().IndexName)
    assert(kBlockHeaderFieldV0.IndexDataStart === offsV0().IndexDataStart, "IndexDataStart" + " should be " + kBlockHeaderFieldV0.IndexDataStart + " but is " + offsV0().IndexDataStart)

     */
    let def: ITableDefinition = {
        id: 0,
        object_id: generateV4UUID(),
        name: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        columns: [{
            name: "COLA",
            type: TableColumnType.uint32,
            nullable: true,
            length: 1,
            defaultExpression: ""
        }, {
            name: "COLB",
            type: TableColumnType.varchar,
            nullable: true,
            length: 25,
            defaultExpression: ""
        }],
        hasIdentity: false,
        identitySeed: 0,
        identityValue: 0,
        identityIncrement: 1,
        identityColumnName: "",
        constraints: []
    };

    let tbl: ITable = newTable(db, def);
    let def2 = readTableDefinition(tbl.data);

    assert(def2.object_id === def.object_id, "object_id not read written or read correctly.");







    checkNoTempTables(db);




    next();
}