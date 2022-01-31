import {ITableData} from "./ITableData";
import {readStringFromUtf8Array} from "../BlockIO/readStringFromUtf8Array";
import {TableColumnType} from "./TableColumnType";
import {TableColumn} from "./TableColumn";
import {ITableDefinition} from "./ITableDefinition";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {writeStringToUtf8ByteArray} from "../BlockIO/writeStringToUtf8ByteArray";
import {serializeTQuery} from "../API/serializeTQuery";
import {kTableConstraintType} from "./kTableConstraintType";
import {kForeignKeyOnEvent} from "./kForeignKeyOnEvent";
import {TTableConstraint} from "./TTableConstraint";
import {predicateTQueryExpression} from "../Query/Parser/predicateTQueryExpression";
import {predicateTQueryComparisonExpression} from "../Query/Parser/predicateTQueryComparisonExpression";
import {predicateTQueryComparison} from "../Query/Parser/predicateTQueryComparison";
import {returnPred} from "../BaseParser/Predicates/ret";
import {oneOf} from "../BaseParser/Predicates/oneOf";
import {ParseResult} from "../BaseParser/ParseResult";
import {ParseError} from "../BaseParser/ParseError";
import {parse} from "../BaseParser/parse";
import {Stream} from "../BaseParser/Stream";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";


/*
    read a table definition from the table header buffer

    This function result should be cached if possible as in the presence of a
    CHECK constraint or DEFAULT expression, the parser will be called to generate an AST
 */
export function readTableDefinition(tb: ITableData, showInvisibleColumns = false): ITableDefinition {
    let ret: ITableDefinition = {
        id: 0,
        name: "",
        columns: [],
        hasIdentity: false,
        identitySeed: 1,
        identityIncrement: 1,
        identityColumnName: "",
        constraints: []
    };

    if (tb.tableDef === undefined) {
        return undefined;
    }
    let b = tb.tableDef;
    let dv = new DataView(b);
    let magix = readStringFromUtf8Array(dv, kBlockHeaderField.TableDefMagic, 4);
    let version = dv.getUint8(kBlockHeaderField.TableDefVersion);
    let tableFlag1 = dv.getUint8(kBlockHeaderField.TableDefFlag1);
    let tableFlag2 = dv.getUint8(kBlockHeaderField.TableDefFlag2);
    let tableFlag3 = dv.getUint8(kBlockHeaderField.TableDefFlag3);
    ret.name = readStringFromUtf8Array(dv, kBlockHeaderField.TableDefTableName, 255);
    ret.hasIdentity = dv.getUint8(kBlockHeaderField.TableDefHasIdentity) === 1;
    ret.identitySeed = dv.getUint32(kBlockHeaderField.TableDefIdentitySeed);
    ret.identityIncrement = dv.getUint32(kBlockHeaderField.TableDefIdentityIncrement);
    ret.identityValue = dv.getUint32(kBlockHeaderField.TableDefIdentityValue);
    ret.identityColumnName = readStringFromUtf8Array(dv, kBlockHeaderField.TableDefIdentityColumnName, 255);

    const numColumns = dv.getUint32(kBlockHeaderField.TableDefNumColumns);
    const rowSize = dv.getUint32(kBlockHeaderField.TableDefRowSize);
    const numConstraints = dv.getUint32(kBlockHeaderField.TableDefNumConstraints);
    const numIndices = dv.getUint32(kBlockHeaderField.TableDefNumIndices);
    const columnsStart = dv.getUint32(kBlockHeaderField.TableDefColumnsStart);
    const constraintsStart = dv.getUint32(kBlockHeaderField.TableDefConstraintsStart);
    const indicesStart = dv.getUint32(kBlockHeaderField.TableDefIndicesStart);

    let offset = columnsStart;

    for (let i = 0; i < numColumns; i ++) {
        const type = dv.getUint8(offset + kBlockHeaderField.TableDefColumnType);
        const flag1 = dv.getUint8(offset + kBlockHeaderField.TableDefColumnFlag1);
        const flag2 = dv.getUint8(offset + kBlockHeaderField.TableDefColumnFlag2);
        const flag3 = dv.getUint8(offset + kBlockHeaderField.TableDefColumnFlag3);
        const length = dv.getUint32(offset + kBlockHeaderField.TableDefColumnLength);
        const columnOffset = dv.getUint32(offset + kBlockHeaderField.TableDefColumnOffset);
        const name = readStringFromUtf8Array(dv, offset + kBlockHeaderField.TableDefColumnName, 255);
        const defaultValue = readStringFromUtf8Array(dv, offset + kBlockHeaderField.TableDefColumnDefaultExpression, 255);
        const invisible = (flag2 & kBlockHeaderField.TableDefColumnFlag2Bit_Invisible) === kBlockHeaderField.TableDefColumnFlag2Bit_Invisible;
        let col: TableColumn = {
            name: name,
            type: type as TableColumnType,
            nullable: (flag1 & kBlockHeaderField.TableDefColumnFlag1Bit_Nullable) === kBlockHeaderField.TableDefColumnFlag1Bit_Nullable,
            defaultExpression: defaultValue,
            length: length,
            offset: columnOffset
        };
        if (invisible === false || showInvisibleColumns === true) {
            if (invisible === true) {
                col.invisible = true;
            }
            ret.columns.push(col);
        }

        offset += kBlockHeaderField.TableDefColumnEnd;
    }

    offset = constraintsStart;
    for (let i = 0; i < numConstraints; i++) {
        const type: kTableConstraintType = dv.getUint8(offset + kBlockHeaderField.TableDefConstraintType);
        const isClustered: boolean = dv.getUint8(offset + kBlockHeaderField.TableDefConstraintIsClustered)  ===  1;
        const numColumns = dv.getUint8(offset + kBlockHeaderField.TableDefConstraintNumberOfColumns);
        const numForeignKeyColumns = dv.getUint8(offset + kBlockHeaderField.TableDefConstraintNumberOfForeignKeyColumns);
        const onUpdate: kForeignKeyOnEvent = dv.getUint8(offset + kBlockHeaderField.TableDefConstraintForeignKeyOnUpdate);
        const onDelete: kForeignKeyOnEvent = dv.getUint8(offset + kBlockHeaderField.TableDefConstraintForeignKeyOnDelete);
        const constraintName = readStringFromUtf8Array(dv, offset + kBlockHeaderField.TableDefConstraintName, 255);
        const foreignKeyTableName = readStringFromUtf8Array(dv, offset + kBlockHeaderField.TableDefConstraintForeignKeyTableName, 255);
        const checkExpression = readStringFromUtf8Array(dv, offset + kBlockHeaderField.TableDefConstraintCheckExpression, 255);
        offset += kBlockHeaderField.TableDefConstraintEnd;

        let parseResult: ParseResult | ParseError = parse((name, value) => {}, function *(callback) {
            let ret = yield oneOf([predicateTQueryComparisonExpression, predicateTQueryComparison], "");
            yield returnPred(ret);
        }, new Stream(checkExpression, 0));
        let checkExpressionValue: TQueryComparisonExpression | TQueryComparison;
        if (instanceOfParseResult(parseResult)) {
            checkExpressionValue = parseResult.value;
        }
        let constraint: TTableConstraint = {
            constraintName: constraintName,
            type: type,
            clustered: isClustered,
            columns: [],
            foreignKeyColumnsRef: [],
            check: checkExpressionValue,
            foreignKeyTable: foreignKeyTableName,
            foreignKeyOnDelete: onDelete,
            foreignKeyOnUpdate: onUpdate
        };
        for (let x = 0; x < numColumns; x++) {
            const ascending: boolean = dv.getUint8(offset + kBlockHeaderField.TableDefConstraint_ColumnSort) === 1;
            const name: string = readStringFromUtf8Array(dv, offset + kBlockHeaderField.TableDefConstraint_ColumnName, 255);
            offset += 256;
            constraint.columns.push({
                name: name,
                ascending: ascending
            });
        }
        for (let x = 0; x < numForeignKeyColumns; x++) {
            const column = readStringFromUtf8Array(dv, offset + kBlockHeaderField.TableDefConstraint_ForeignKeyColumnName, 255);
            offset += 255;
            constraint.foreignKeyColumnsRef.push(column);
        }
        ret.constraints.push(constraint);
    }



    if (numIndices > 0) {
        offset = indicesStart;
        for (let i = 0; i < numIndices; i++) {
            const indexName = readStringFromUtf8Array(dv, offset, 50);
            const indexColumn = readStringFromUtf8Array(dv, offset + 50, 50);
        }
    }

    return ret;

}