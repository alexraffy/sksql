import {ITableData} from "./ITableData";
import {readStringFromUtf8Array} from "../BlockIO/readStringFromUtf8Array";
import {TableColumnType} from "./TableColumnType";
import {TableColumn} from "./TableColumn";
import {ITableDefinition, ITableDefinitionV0} from "./ITableDefinition";
import {offs, offsV0} from "../Blocks/kBlockHeaderField";
import {kTableConstraintType} from "./kTableConstraintType";
import {kForeignKeyOnEvent} from "./kForeignKeyOnEvent";
import {TTableConstraint} from "./TTableConstraint";
import {predicateTQueryExpression} from "../Query/Parser/predicateTQueryExpression";
import {returnPred} from "../BaseParser/Predicates/ret";
import {ParseResult} from "../BaseParser/ParseResult";
import {ParseError} from "../BaseParser/ParseError";
import {parse} from "../BaseParser/parse";
import {Stream} from "../BaseParser/Stream";

import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {TValidExpressions} from "../Query/Types/TValidExpressions";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {generateV4UUID} from "../API/generateV4UUID";


/*
    read a table definition from the table header buffer

    This function result should be cached if possible as in the presence of a
    CHECK constraint or DEFAULT expression, the parser will be called to generate an AST
 */
export function readTableDefinition(tb: ITableData, showInvisibleColumns: boolean = false): ITableDefinition {
    let ret: ITableDefinition = {
        id: 0,
        object_id: "",
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
    let magix = readStringFromUtf8Array(dv, offs().TableDefMagic, 4);
    let version = dv.getUint8(offs().TableDefVersion);
    if (version === 0) {
        let ret2 = readTableDefinitionV0(tb, showInvisibleColumns);
        ret = JSON.parse(JSON.stringify(ret2));
        ret.object_id = generateV4UUID();
        return ret;
    }

    let tableFlag1 = dv.getUint8(offs().TableDefFlag1);
    let tableFlag2 = dv.getUint8(offs().TableDefFlag2);
    let tableFlag3 = dv.getUint8(offs().TableDefFlag3);
    ret.object_id = readStringFromUtf8Array(dv, offs().TableDefTableObjectId, 36);
    ret.name = readStringFromUtf8Array(dv, offs().TableDefTableName, 255);
    ret.hasIdentity = dv.getUint8(offs().TableDefHasIdentity) === 1;
    ret.identitySeed = dv.getUint32(offs().TableDefIdentitySeed);
    ret.identityIncrement = dv.getUint32(offs().TableDefIdentityIncrement);
    ret.identityValue = dv.getUint32(offs().TableDefIdentityValue);
    ret.identityColumnName = readStringFromUtf8Array(dv, offs().TableDefIdentityColumnName, 255);

    const numColumns = dv.getUint32(offs().TableDefNumColumns);
    const rowSize = dv.getUint32(offs().TableDefRowSize);
    const numConstraints = dv.getUint32(offs().TableDefNumConstraints);
    const numIndices = dv.getUint32(offs().TableDefNumIndices);
    const columnsStart = dv.getUint32(offs().TableDefColumnsStart);
    const constraintsStart = dv.getUint32(offs().TableDefConstraintsStart);
    const indicesStart = dv.getUint32(offs().TableDefIndicesStart);

    let offset = columnsStart;

    for (let i = 0; i < numColumns; i ++) {
        const type = dv.getUint8(offset + offs().TableDefColumnType);
        const flag1 = dv.getUint8(offset + offs().TableDefColumnFlag1);
        const flag2 = dv.getUint8(offset + offs().TableDefColumnFlag2);
        const decimal = dv.getUint8(offset + offs().TableDefColumnFlag3);
        const length = dv.getUint32(offset + offs().TableDefColumnLength);
        const columnOffset = dv.getUint32(offset + offs().TableDefColumnOffset);
        const name = readStringFromUtf8Array(dv, offset + offs().TableDefColumnName, 255);
        const defaultValue = readStringFromUtf8Array(dv, offset + offs().TableDefColumnDefaultExpression, 255);
        const invisible = (flag2 & offs().TableDefColumnFlag2Bit_Invisible) === offs().TableDefColumnFlag2Bit_Invisible;

        let col: TableColumn = {
            name: name,
            type: type as TableColumnType,
            nullable: (flag1 & offs().TableDefColumnFlag1Bit_Nullable) === offs().TableDefColumnFlag1Bit_Nullable,
            defaultExpression: defaultValue,
            length: length,
            decimal: decimal,
            offset: columnOffset
        };
        if (invisible === false || showInvisibleColumns === true) {
            if (invisible === true) {
                col.invisible = true;
            }
            ret.columns.push(col);
        }

        offset += offs().TableDefColumnEnd;
    }

    offset = constraintsStart;
    for (let i = 0; i < numConstraints; i++) {
        const type: kTableConstraintType = dv.getUint8(offset + offs().TableDefConstraintType);
        const isClustered: boolean = dv.getUint8(offset + offs().TableDefConstraintIsClustered)  ===  1;
        const numColumns = dv.getUint8(offset + offs().TableDefConstraintNumberOfColumns);
        const numForeignKeyColumns = dv.getUint8(offset + offs().TableDefConstraintNumberOfForeignKeyColumns);
        const onUpdate: kForeignKeyOnEvent = dv.getUint8(offset + offs().TableDefConstraintForeignKeyOnUpdate);
        const onDelete: kForeignKeyOnEvent = dv.getUint8(offset + offs().TableDefConstraintForeignKeyOnDelete);
        const constraintName = readStringFromUtf8Array(dv, offset + offs().TableDefConstraintName, 255);
        const foreignKeyTableName = readStringFromUtf8Array(dv, offset + offs().TableDefConstraintForeignKeyTableName, 255);
        const checkExpression = readStringFromUtf8Array(dv, offset + offs().TableDefConstraintCheckExpression, 255);
        offset += offs().TableDefConstraintEnd;

        let parseResult: ParseResult | ParseError = parse((name, value) => {}, function *(callback) {
            let ret = yield predicateTQueryExpression;
            yield returnPred(ret);
        }, new Stream(checkExpression, 0));
        let checkExpressionValue: TQueryExpression | TValidExpressions;
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
            const ascending: boolean = dv.getUint8(offset + offs().TableDefConstraint_ColumnSort) === 1;
            const name: string = readStringFromUtf8Array(dv, offset + offs().TableDefConstraint_ColumnName, 255);
            offset += 256;
            constraint.columns.push({
                name: name,
                ascending: ascending
            });
        }
        for (let x = 0; x < numForeignKeyColumns; x++) {
            const column = readStringFromUtf8Array(dv, offset + offs().TableDefConstraint_ForeignKeyColumnName, 255);
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

export function readTableDefinitionV0(tb: ITableData, showInvisibleColumns = false): ITableDefinitionV0 {
    let ret: ITableDefinitionV0 = {
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
    let magix = readStringFromUtf8Array(dv, offsV0().TableDefMagic, 4);
    let version = dv.getUint8(offsV0().TableDefVersion);
    let tableFlag1 = dv.getUint8(offsV0().TableDefFlag1);
    let tableFlag2 = dv.getUint8(offsV0().TableDefFlag2);
    let tableFlag3 = dv.getUint8(offsV0().TableDefFlag3);
    ret.name = readStringFromUtf8Array(dv, offsV0().TableDefTableName, 255);
    ret.hasIdentity = dv.getUint8(offsV0().TableDefHasIdentity) === 1;
    ret.identitySeed = dv.getUint32(offsV0().TableDefIdentitySeed);
    ret.identityIncrement = dv.getUint32(offsV0().TableDefIdentityIncrement);
    ret.identityValue = dv.getUint32(offsV0().TableDefIdentityValue);
    ret.identityColumnName = readStringFromUtf8Array(dv, offsV0().TableDefIdentityColumnName, 255);

    const numColumns = dv.getUint32(offsV0().TableDefNumColumns);
    const rowSize = dv.getUint32(offsV0().TableDefRowSize);
    const numConstraints = dv.getUint32(offsV0().TableDefNumConstraints);
    const numIndices = dv.getUint32(offsV0().TableDefNumIndices);
    const columnsStart = dv.getUint32(offsV0().TableDefColumnsStart);
    const constraintsStart = dv.getUint32(offsV0().TableDefConstraintsStart);
    const indicesStart = dv.getUint32(offsV0().TableDefIndicesStart);

    let offset = columnsStart;

    for (let i = 0; i < numColumns; i ++) {
        const type = dv.getUint8(offset + offsV0().TableDefColumnType);
        const flag1 = dv.getUint8(offset + offsV0().TableDefColumnFlag1);
        const flag2 = dv.getUint8(offset + offsV0().TableDefColumnFlag2);
        const decimal = dv.getUint8(offset + offsV0().TableDefColumnFlag3);
        const length = dv.getUint32(offset + offsV0().TableDefColumnLength);
        const columnOffset = dv.getUint32(offset + offsV0().TableDefColumnOffset);
        const name = readStringFromUtf8Array(dv, offset + offsV0().TableDefColumnName, 255);
        const defaultValue = readStringFromUtf8Array(dv, offset + offsV0().TableDefColumnDefaultExpression, 255);
        const invisible = (flag2 & offsV0().TableDefColumnFlag2Bit_Invisible) === offsV0().TableDefColumnFlag2Bit_Invisible;

        let col: TableColumn = {
            name: name,
            type: type as TableColumnType,
            nullable: (flag1 & offsV0().TableDefColumnFlag1Bit_Nullable) === offsV0().TableDefColumnFlag1Bit_Nullable,
            defaultExpression: defaultValue,
            length: length,
            decimal: decimal,
            offset: columnOffset
        };
        if (invisible === false || showInvisibleColumns === true) {
            if (invisible === true) {
                col.invisible = true;
            }
            ret.columns.push(col);
        }

        offset += offsV0().TableDefColumnEnd;
    }

    offset = constraintsStart;
    for (let i = 0; i < numConstraints; i++) {
        const type: kTableConstraintType = dv.getUint8(offset + offsV0().TableDefConstraintType);
        const isClustered: boolean = dv.getUint8(offset + offsV0().TableDefConstraintIsClustered)  ===  1;
        const numColumns = dv.getUint8(offset + offsV0().TableDefConstraintNumberOfColumns);
        const numForeignKeyColumns = dv.getUint8(offset + offsV0().TableDefConstraintNumberOfForeignKeyColumns);
        const onUpdate: kForeignKeyOnEvent = dv.getUint8(offset + offsV0().TableDefConstraintForeignKeyOnUpdate);
        const onDelete: kForeignKeyOnEvent = dv.getUint8(offset + offsV0().TableDefConstraintForeignKeyOnDelete);
        const constraintName = readStringFromUtf8Array(dv, offset + offsV0().TableDefConstraintName, 255);
        const foreignKeyTableName = readStringFromUtf8Array(dv, offset + offsV0().TableDefConstraintForeignKeyTableName, 255);
        const checkExpression = readStringFromUtf8Array(dv, offset + offsV0().TableDefConstraintCheckExpression, 255);
        offset += offsV0().TableDefConstraintEnd;

        let parseResult: ParseResult | ParseError = parse((name, value) => {}, function *(callback) {
            let ret = yield predicateTQueryExpression;
            yield returnPred(ret);
        }, new Stream(checkExpression, 0));
        let checkExpressionValue: TQueryExpression | TValidExpressions;
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
            const ascending: boolean = dv.getUint8(offset + offsV0().TableDefConstraint_ColumnSort) === 1;
            const name: string = readStringFromUtf8Array(dv, offset + offsV0().TableDefConstraint_ColumnName, 255);
            offset += 256;
            constraint.columns.push({
                name: name,
                ascending: ascending
            });
        }
        for (let x = 0; x < numForeignKeyColumns; x++) {
            const column = readStringFromUtf8Array(dv, offset + offsV0().TableDefConstraint_ForeignKeyColumnName, 255);
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