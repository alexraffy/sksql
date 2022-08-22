import {writeStringToUtf8ByteArray} from "../BlockIO/writeStringToUtf8ByteArray";
import {ITableDefinition} from "./ITableDefinition";
import {ITableData} from "./ITableData";
import {newBlock} from "../Blocks/newBlock";
import {BlockType} from "../Blocks/BlockType";
import {headerLengthForTableDefinition} from "./headerLengthForTableDefinition";
import {blockInfo} from "../Blocks/blockInfo";
import {TableColumnType} from "./TableColumnType";
import {serializeTQuery} from "../API/serializeTQuery";
import {kSysColumns} from "./kSysColumns";
import {TableColumn} from "./TableColumn";
import {TTableConstraint} from "./TTableConstraint";
import {offs, offsV0} from "../Blocks/kBlockHeaderField";

/*
    write a table header

 */

export function writeTableDefinition(tb: ITableData, tbl: ITableDefinition): ITableDefinition {
    let d: DataView = undefined;
    let ret: ITableDefinition = {
        object_id: tbl.object_id,
        name: tbl.name,
        identityValue: tbl.identityValue,
        identityIncrement: tbl.identityIncrement,
        identitySeed: tbl.identitySeed,
        identityColumnName: tbl.identityColumnName,
        hasIdentity: tbl.hasIdentity,
        columns: [],
        constraints: [],
        id: tbl.id
    };

    // add sys columns
    // last id of the transaction that modified the row
    const exists = (tbl.columns.find((c) => { return c.name === kSysColumns.change_xdes_id;}));
    if (exists === undefined) {
        tbl.columns.push({
            name: kSysColumns.change_xdes_id,
            length: 1,
            type: TableColumnType.uint32,
            defaultExpression: "",
            invisible: true,
            nullable: true
        });
    }

    let blockSize = 65536;
    const spaceRequired = headerLengthForTableDefinition(tbl);
    while (blockSize < spaceRequired + 25) {
        blockSize = blockSize * 2;
    }
    let b = newBlock(blockSize, BlockType.tableDefinition, 1);
    blockInfo(b);
    tb.tableDef = b;
    d = new DataView(b);
    // magic
    writeStringToUtf8ByteArray(d, offs().TableDefMagic, "TSDB", 4);
    // Table Flags
    d.setUint8(offs().TableDefVersion, 1);
    d.setUint8(offs().TableDefFlag1, 0);
    d.setUint8(offs().TableDefFlag2, 0);
    d.setUint8(offs().TableDefFlag3, 0);
    // reserve 36 bytes for the table object_id
    writeStringToUtf8ByteArray(d, offs().TableDefTableObjectId, tbl.object_id, 36);
    // reserve 255 bytes for the name of the table
    writeStringToUtf8ByteArray(d, offs().TableDefTableName, tbl.name, 255);
    // identity
    d.setUint8(offs().TableDefHasIdentity, (tbl.hasIdentity === true) ? 1 : 0);
    d.setUint32(offs().TableDefIdentitySeed, tbl.identitySeed);
    d.setUint32(offs().TableDefIdentityIncrement, tbl.identityIncrement);
    d.setUint32(offs().TableDefIdentityValue, tbl.identitySeed);
    writeStringToUtf8ByteArray(d, offs().TableDefIdentityColumnName, tbl.identityColumnName, 255);

    // write the number of columns
    d.setUint32(offs().TableDefNumColumns, tbl.columns.length);
    // row size
    d.setUint32(offs().TableDefRowSize, 0); // update after

    // number of constraints
    d.setUint32(offs().TableDefNumConstraints, tbl.constraints.length);

    // number of indices in table
    d.setUint32(offs().TableDefNumIndices, 0);
    // start of columns definition
    d.setUint32(offs().TableDefColumnsStart, offs().TableDefColumnsStartDefault);
    // start of constraints definition
    d.setUint32(offs().TableDefConstraintsStart, 0); // update after columns are set.
    // start of indices definition
    d.setUint32(offs().TableDefIndicesStart, 0); // update after columns def

    let offset = offs().TableDefColumnsStartDefault;
    let columnOffset = 0;
    for (let i = 0; i < tbl.columns.length; i ++) {
        let c = tbl.columns[i];
        let columnFlag1 = 0;
        if (c.nullable === true) {
            columnFlag1 = columnFlag1 | offs().TableDefColumnFlag1Bit_Nullable;
        }
        if (c.defaultExpression !== "") {
            columnFlag1 = columnFlag1 | offs().TableDefColumnFlag1Bit_HasDefaultExpression;
        }
        let columnFlag2 = 0;
        if (c.invisible === true) {
            columnFlag2 = columnFlag2 | offs().TableDefColumnFlag2Bit_Invisible;
        }

        d.setUint8(offset + offs().TableDefColumnType,c.type);
        d.setUint8(offset + offs().TableDefColumnFlag1, columnFlag1);
        d.setUint8(offset + offs().TableDefColumnFlag2, columnFlag2);
        d.setUint8(offset + offs().TableDefColumnFlag3, (c.decimal===undefined) ? 0 : c.decimal);
        d.setUint32(offset + offs().TableDefColumnLength, c.length);
        d.setUint32(offset + offs().TableDefColumnOffset, columnOffset);
        writeStringToUtf8ByteArray(d, offset + offs().TableDefColumnName, c.name, 255);
        if (c.defaultExpression !== undefined && typeof c.defaultExpression === "string" && c.defaultExpression !== "") {
            writeStringToUtf8ByteArray(d, offset + offs().TableDefColumnDefaultExpression, c.defaultExpression, 255);
        }

        let col: TableColumn = {
            name: c.name,
            length: c.length,
            type: c.type,
            nullable: c.nullable,
            invisible: c.invisible,
            defaultExpression: c.defaultExpression,
            decimal: c.decimal,
            offset: columnOffset
        }
        ret.columns.push(col);

        // column flag isNull
        columnOffset += 1;
        switch (c.type) {
            case TableColumnType.uint8:
            case TableColumnType.int8:
                columnOffset += 1;
                break;
            case TableColumnType.uint16:
            case TableColumnType.int16:
                columnOffset += 2;
                break;
            case TableColumnType.uint32:
            case TableColumnType.int32:
                columnOffset += 4;
                break;
            case TableColumnType.uint64:
            case TableColumnType.int64:
                columnOffset += 8;
                break;
            case TableColumnType.int:
                columnOffset += 4;
                break;
            case TableColumnType.boolean:
                columnOffset += 1;
                break;
            case TableColumnType.varchar:
                columnOffset += 1 * c.length;
                break;
            case TableColumnType.numeric:
                columnOffset += 1 + 8 + 2;
                break;
            case TableColumnType.float:
                columnOffset += 4;
                break;
            case TableColumnType.double:
                columnOffset += 8;
                break;
            case TableColumnType.date:
                columnOffset += 1 + 4 + 1 + 1;
                break;
            case TableColumnType.time:
                columnOffset += 1 + 1 + 1 + 2;
                break;
            case TableColumnType.datetime:
                columnOffset += 1 + 4 + 1 + 1 + 1 + 1 + 1 + 2;
                break;
            default:
                columnOffset += (1 * c.length);
        }


        offset += offs().TableDefColumnEnd;
    }
    // update the size of a row
    d.setUint32(offs().TableDefRowSize, columnOffset);
    // update the start of constraints
    d.setUint32(offs().TableDefConstraintsStart, offset);
    for (let i = 0; i < tbl.constraints.length; i++) {
        let c = tbl.constraints[i];

        let cr: TTableConstraint = {
            constraintName: c.constraintName,
            type: c.type,
            columns: c.columns,
            foreignKeyColumnsRef: c.foreignKeyColumnsRef,
            foreignKeyTable: c.foreignKeyTable,
            check: c.check,
            clustered: c.clustered,
            foreignKeyOnDelete: c.foreignKeyOnDelete,
            foreignKeyOnUpdate: c.foreignKeyOnUpdate
        }
        ret.constraints.push(cr);

        d.setUint8(offset + offs().TableDefConstraintType, c.type);
        d.setUint8(offset + offs().TableDefConstraintIsClustered, (c.clustered === true) ? 1 : 0);
        d.setUint8(offset + offs().TableDefConstraintNumberOfColumns, c.columns.length);
        d.setUint8(offset + offs().TableDefConstraintNumberOfForeignKeyColumns, c.foreignKeyColumnsRef.length);
        d.setUint8(offset + offs().TableDefConstraintForeignKeyOnUpdate, c.foreignKeyOnUpdate);
        d.setUint8(offset + offs().TableDefConstraintForeignKeyOnDelete, c.foreignKeyOnDelete);
        writeStringToUtf8ByteArray(d, offset + offs().TableDefConstraintName, c.constraintName, 255);
        writeStringToUtf8ByteArray(d, offset + offs().TableDefConstraintForeignKeyTableName, c.foreignKeyTable, 255);
        if (c.check !== undefined) {
            writeStringToUtf8ByteArray(d, offset + offs().TableDefConstraintCheckExpression, serializeTQuery(c.check), 255);
        }
        offset += offs().TableDefConstraintEnd;
        for (let x = 0; x < c.columns.length; x++) {
            d.setUint8(offset + offs().TableDefConstraint_ColumnSort, (c.columns[x].ascending === true) ? 1 : 0);
            writeStringToUtf8ByteArray(d, offset + offs().TableDefConstraint_ColumnName, c.columns[x].name, 255);
            offset += 256;
        }
        for (let x = 0; x < c.foreignKeyColumnsRef.length; x++) {
            writeStringToUtf8ByteArray(d, offset + offs().TableDefConstraint_ForeignKeyColumnName, c.foreignKeyColumnsRef[x], 255);
            offset += 255;
        }
    }

    // update the start of indices def
    d.setUint32(offs().TableDefIndicesStart, offset);

    d.setUint32(offs().DataEnd, offset);


    return ret;
}




export function writeTableDefinitionV0(tb: ITableData, tbl: ITableDefinition): ITableDefinition {
    let d: DataView = undefined;
    let ret: ITableDefinition = {
        object_id: tbl.object_id,
        name: tbl.name,
        identityValue: tbl.identityValue,
        identityIncrement: tbl.identityIncrement,
        identitySeed: tbl.identitySeed,
        identityColumnName: tbl.identityColumnName,
        hasIdentity: tbl.hasIdentity,
        columns: [],
        constraints: [],
        id: tbl.id
    };

    // add sys columns
    // last id of the transaction that modified the row
    const exists = (tbl.columns.find((c) => { return c.name === kSysColumns.change_xdes_id;}));
    if (exists === undefined) {
        tbl.columns.push({
            name: kSysColumns.change_xdes_id,
            length: 1,
            type: TableColumnType.uint32,
            defaultExpression: "",
            invisible: true,
            nullable: true
        });
    }

    let blockSize = 65536;
    const spaceRequired = headerLengthForTableDefinition(tbl);
    while (blockSize < spaceRequired + 25) {
        blockSize = blockSize * 2;
    }
    let b = newBlock(blockSize, BlockType.tableDefinition, 1);
    blockInfo(b);
    tb.tableDef = b;
    d = new DataView(b);
    // magic
    writeStringToUtf8ByteArray(d, offsV0().TableDefMagic, "TSDB", 4);
    // Table Flags
    d.setUint8(offsV0().TableDefVersion, 0);
    d.setUint8(offsV0().TableDefFlag1, 0);
    d.setUint8(offsV0().TableDefFlag2, 0);
    d.setUint8(offsV0().TableDefFlag3, 0);
    // reserve 255 bytes for the name of the table
    writeStringToUtf8ByteArray(d, offsV0().TableDefTableName, tbl.name, 255);
    // identity
    d.setUint8(offsV0().TableDefHasIdentity, (tbl.hasIdentity === true) ? 1 : 0);
    d.setUint32(offsV0().TableDefIdentitySeed, tbl.identitySeed);
    d.setUint32(offsV0().TableDefIdentityIncrement, tbl.identityIncrement);
    d.setUint32(offsV0().TableDefIdentityValue, tbl.identitySeed);
    writeStringToUtf8ByteArray(d, offsV0().TableDefIdentityColumnName, tbl.identityColumnName, 255);

    // write the number of columns
    d.setUint32(offsV0().TableDefNumColumns, tbl.columns.length);
    // row size
    d.setUint32(offsV0().TableDefRowSize, 0); // update after

    // number of constraints
    d.setUint32(offsV0().TableDefNumConstraints, tbl.constraints.length);

    // number of indices in table
    d.setUint32(offsV0().TableDefNumIndices, 0);
    // start of columns definition
    d.setUint32(offsV0().TableDefColumnsStart, offsV0().TableDefColumnsStartDefault);
    // start of constraints definition
    d.setUint32(offsV0().TableDefConstraintsStart, 0); // update after columns are set.
    // start of indices definition
    d.setUint32(offsV0().TableDefIndicesStart, 0); // update after columns def

    let offset = offsV0().TableDefColumnsStartDefault;
    let columnOffset = 0;
    for (let i = 0; i < tbl.columns.length; i ++) {
        let c = tbl.columns[i];
        let columnFlag1 = 0;
        if (c.nullable === true) {
            columnFlag1 = columnFlag1 | offsV0().TableDefColumnFlag1Bit_Nullable;
        }
        if (c.defaultExpression !== "") {
            columnFlag1 = columnFlag1 | offsV0().TableDefColumnFlag1Bit_HasDefaultExpression;
        }
        let columnFlag2 = 0;
        if (c.invisible === true) {
            columnFlag2 = columnFlag2 | offsV0().TableDefColumnFlag2Bit_Invisible;
        }

        d.setUint8(offset + offsV0().TableDefColumnType,c.type);
        d.setUint8(offset + offsV0().TableDefColumnFlag1, columnFlag1);
        d.setUint8(offset + offsV0().TableDefColumnFlag2, columnFlag2);
        d.setUint8(offset + offsV0().TableDefColumnFlag3, (c.decimal===undefined) ? 0 : c.decimal);
        d.setUint32(offset + offsV0().TableDefColumnLength, c.length);
        d.setUint32(offset + offsV0().TableDefColumnOffset, columnOffset);
        writeStringToUtf8ByteArray(d, offset + offsV0().TableDefColumnName, c.name, 255);
        if (c.defaultExpression !== undefined && typeof c.defaultExpression === "string" && c.defaultExpression !== "") {
            writeStringToUtf8ByteArray(d, offset + offsV0().TableDefColumnDefaultExpression, c.defaultExpression, 255);
        }

        let col: TableColumn = {
            name: c.name,
            length: c.length,
            type: c.type,
            nullable: c.nullable,
            invisible: c.invisible,
            defaultExpression: c.defaultExpression,
            decimal: c.decimal,
            offset: columnOffset
        }
        ret.columns.push(col);

        // column flag isNull
        columnOffset += 1;
        switch (c.type) {
            case TableColumnType.uint8:
            case TableColumnType.int8:
                columnOffset += 1;
                break;
            case TableColumnType.uint16:
            case TableColumnType.int16:
                columnOffset += 2;
                break;
            case TableColumnType.uint32:
            case TableColumnType.int32:
                columnOffset += 4;
                break;
            case TableColumnType.uint64:
            case TableColumnType.int64:
                columnOffset += 8;
                break;
            case TableColumnType.int:
                columnOffset += 4;
                break;
            case TableColumnType.boolean:
                columnOffset += 1;
                break;
            case TableColumnType.varchar:
                columnOffset += 1 * c.length;
                break;
            case TableColumnType.numeric:
                columnOffset += 1 + 8 + 2;
                break;
            case TableColumnType.float:
                columnOffset += 4;
                break;
            case TableColumnType.double:
                columnOffset += 8;
                break;
            case TableColumnType.date:
                columnOffset += 1 + 4 + 1 + 1;
                break;
            case TableColumnType.time:
                columnOffset += 1 + 1 + 1 + 2;
                break;
            case TableColumnType.datetime:
                columnOffset += 1 + 4 + 1 + 1 + 1 + 1 + 1 + 2;
                break;
            default:
                columnOffset += (1 * c.length);
        }


        offset += offsV0().TableDefColumnEnd;
    }
    // update the size of a row
    d.setUint32(offsV0().TableDefRowSize, columnOffset);
    // update the start of constraints
    d.setUint32(offsV0().TableDefConstraintsStart, offset);
    for (let i = 0; i < tbl.constraints.length; i++) {
        let c = tbl.constraints[i];

        let cr: TTableConstraint = {
            constraintName: c.constraintName,
            type: c.type,
            columns: c.columns,
            foreignKeyColumnsRef: c.foreignKeyColumnsRef,
            foreignKeyTable: c.foreignKeyTable,
            check: c.check,
            clustered: c.clustered,
            foreignKeyOnDelete: c.foreignKeyOnDelete,
            foreignKeyOnUpdate: c.foreignKeyOnUpdate
        }
        ret.constraints.push(cr);

        d.setUint8(offset + offsV0().TableDefConstraintType, c.type);
        d.setUint8(offset + offsV0().TableDefConstraintIsClustered, (c.clustered === true) ? 1 : 0);
        d.setUint8(offset + offsV0().TableDefConstraintNumberOfColumns, c.columns.length);
        d.setUint8(offset + offsV0().TableDefConstraintNumberOfForeignKeyColumns, c.foreignKeyColumnsRef.length);
        d.setUint8(offset + offsV0().TableDefConstraintForeignKeyOnUpdate, c.foreignKeyOnUpdate);
        d.setUint8(offset + offsV0().TableDefConstraintForeignKeyOnDelete, c.foreignKeyOnDelete);
        writeStringToUtf8ByteArray(d, offset + offsV0().TableDefConstraintName, c.constraintName, 255);
        writeStringToUtf8ByteArray(d, offset + offsV0().TableDefConstraintForeignKeyTableName, c.foreignKeyTable, 255);
        if (c.check !== undefined) {
            writeStringToUtf8ByteArray(d, offset + offsV0().TableDefConstraintCheckExpression, serializeTQuery(c.check), 255);
        }
        offset += offsV0().TableDefConstraintEnd;
        for (let x = 0; x < c.columns.length; x++) {
            d.setUint8(offset + offsV0().TableDefConstraint_ColumnSort, (c.columns[x].ascending === true) ? 1 : 0);
            writeStringToUtf8ByteArray(d, offset + offsV0().TableDefConstraint_ColumnName, c.columns[x].name, 255);
            offset += 256;
        }
        for (let x = 0; x < c.foreignKeyColumnsRef.length; x++) {
            writeStringToUtf8ByteArray(d, offset + offsV0().TableDefConstraint_ForeignKeyColumnName, c.foreignKeyColumnsRef[x], 255);
            offset += 255;
        }
    }

    // update the start of indices def
    d.setUint32(offsV0().TableDefIndicesStart, offset);

    d.setUint32(offsV0().DataEnd, offset);


    return ret;
}





