import {writeStringToUtf8ByteArray} from "../BlockIO/writeStringToUtf8ByteArray";
import {ITableDefinition} from "./ITableDefinition";
import {ITableData} from "./ITableData";
import {newBlock} from "../Blocks/newBlock";
import {BlockType} from "../Blocks/BlockType";
import {headerLengthForTableDefinition} from "./headerLengthForTableDefinition";
import {blockInfo} from "../Blocks/blockInfo";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {TableColumnType} from "./TableColumnType";
import {serializeTQuery} from "../API/serializeTQuery";

/*
    write a table header

 */
export function writeTableDefinition(tb: ITableData, tbl: ITableDefinition) {
    let d: DataView = undefined;

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
    writeStringToUtf8ByteArray(d, kBlockHeaderField.TableDefMagic, "TSDB", 4);
    // Table Flags
    d.setUint8(kBlockHeaderField.TableDefVersion, 0);
    d.setUint8(kBlockHeaderField.TableDefFlag1, 0);
    d.setUint8(kBlockHeaderField.TableDefFlag2, 0);
    d.setUint8(kBlockHeaderField.TableDefFlag3, 0);
    // reserve 255 bytes for the name of the table
    writeStringToUtf8ByteArray(d, kBlockHeaderField.TableDefTableName, tbl.name, 255);
    // identity
    d.setUint8(kBlockHeaderField.TableDefHasIdentity, (tbl.hasIdentity === true) ? 1 : 0);
    d.setUint32(kBlockHeaderField.TableDefIdentitySeed, tbl.identitySeed);
    d.setUint32(kBlockHeaderField.TableDefIdentityIncrement, tbl.identityIncrement);
    d.setUint32(kBlockHeaderField.TableDefIdentityValue, tbl.identitySeed);
    writeStringToUtf8ByteArray(d, kBlockHeaderField.TableDefIdentityColumnName, tbl.identityColumnName, 255);

    // write the number of columns
    d.setUint32(kBlockHeaderField.TableDefNumColumns, tbl.columns.length);
    // row size
    d.setUint32(kBlockHeaderField.TableDefRowSize, 0); // update after

    // number of constraints
    d.setUint32(kBlockHeaderField.TableDefNumConstraints, tbl.constraints.length);

    // number of indices in table
    d.setUint32(kBlockHeaderField.TableDefNumIndices, 0);
    // start of columns definition
    d.setUint32(kBlockHeaderField.TableDefColumnsStart, kBlockHeaderField.TableDefColumnsStartDefault);
    // start of constraints definition
    d.setUint32(kBlockHeaderField.TableDefConstraintsStart, 0); // update after columns are set.
    // start of indices definition
    d.setUint32(kBlockHeaderField.TableDefIndicesStart, 0); // update after columns def

    let offset = kBlockHeaderField.TableDefColumnsStartDefault;
    let columnOffset = 0;
    for (let i = 0; i < tbl.columns.length; i ++) {
        let c = tbl.columns[i];
        let columnFlag1 = 0;
        if (c.nullable === true) {
            columnFlag1 = columnFlag1 | kBlockHeaderField.TableDefColumnFlag1Bit_Nullable;
        }
        if (c.defaultExpression !== "") {
            columnFlag1 = columnFlag1 | kBlockHeaderField.TableDefColumnFlag1Bit_HasDefaultExpression;
        }
        let columnFlag2 = 0;
        if (c.invisible === true) {
            columnFlag2 = columnFlag2 | kBlockHeaderField.TableDefColumnFlag2Bit_Invisible;
        }

        d.setUint8(offset + kBlockHeaderField.TableDefColumnType,c.type);
        d.setUint8(offset + kBlockHeaderField.TableDefColumnFlag1, columnFlag1);
        d.setUint8(offset + kBlockHeaderField.TableDefColumnFlag2, columnFlag2);
        d.setUint8(offset + kBlockHeaderField.TableDefColumnFlag3, 0);
        d.setUint32(offset + kBlockHeaderField.TableDefColumnLength, c.length);
        d.setUint32(offset + kBlockHeaderField.TableDefColumnOffset, columnOffset);
        writeStringToUtf8ByteArray(d, offset + kBlockHeaderField.TableDefColumnName, c.name, 255);
        if (c.defaultExpression !== undefined && typeof c.defaultExpression === "string" && c.defaultExpression !== "") {
            writeStringToUtf8ByteArray(d, offset + kBlockHeaderField.TableDefColumnDefaultExpression, c.defaultExpression, 255);
        }
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
                columnOffset += 1 + 4 + 2;
                break;
            case TableColumnType.date:
                columnOffset += 1 + 4 + 1 + 1;
                break;
            default:
                columnOffset += (1 * c.length);
        }

        offset += kBlockHeaderField.TableDefColumnEnd;
    }
    // update the size of a row
    d.setUint32(kBlockHeaderField.TableDefRowSize, columnOffset);
    // update the start of constraints
    d.setUint32(kBlockHeaderField.TableDefConstraintsStart, offset);
    for (let i = 0; i < tbl.constraints.length; i++) {
        let c = tbl.constraints[i];
        d.setUint8(offset + kBlockHeaderField.TableDefConstraintType, c.type);
        d.setUint8(offset + kBlockHeaderField.TableDefConstraintIsClustered, (c.clustered === true) ? 1 : 0);
        d.setUint8(offset + kBlockHeaderField.TableDefConstraintNumberOfColumns, c.columns.length);
        d.setUint8(offset + kBlockHeaderField.TableDefConstraintNumberOfForeignKeyColumns, c.foreignKeyColumnsRef.length);
        d.setUint8(offset + kBlockHeaderField.TableDefConstraintForeignKeyOnUpdate, c.foreignKeyOnUpdate);
        d.setUint8(offset + kBlockHeaderField.TableDefConstraintForeignKeyOnDelete, c.foreignKeyOnDelete);
        writeStringToUtf8ByteArray(d, offset + kBlockHeaderField.TableDefConstraintName, c.constraintName, 255);
        writeStringToUtf8ByteArray(d, offset + kBlockHeaderField.TableDefConstraintForeignKeyTableName, c.foreignKeyTable, 255);
        if (c.check !== undefined) {
            writeStringToUtf8ByteArray(d, offset + kBlockHeaderField.TableDefConstraintCheckExpression, serializeTQuery(c.check), 255);
        }
        offset += kBlockHeaderField.TableDefConstraintEnd;
        for (let x = 0; x < c.columns.length; x++) {
            d.setUint8(offset + kBlockHeaderField.TableDefConstraint_ColumnSort, (c.columns[x].ascending === true) ? 1 : 0);
            writeStringToUtf8ByteArray(d, offset + kBlockHeaderField.TableDefConstraint_ColumnName, c.columns[x].name, 255);
            offset += 256;
        }
        for (let x = 0; x < c.foreignKeyColumnsRef.length; x++) {
            writeStringToUtf8ByteArray(d, offset + kBlockHeaderField.TableDefConstraint_ForeignKeyColumnName, c.foreignKeyColumnsRef[x], 255);
            offset += 255;
        }
    }

    // update the start of indices def
    d.setUint32(kBlockHeaderField.TableDefIndicesStart, offset);

    d.setUint32(kBlockHeaderField.DataEnd, offset);

}





