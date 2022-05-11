import {TExecutionContext} from "./TExecutionContext";
import {TTableConstraint} from "../Table/TTableConstraint";
import {kTableConstraintType} from "../Table/kTableConstraintType";
import {rowHeaderSize} from "../Table/addRow";
import {TParserError} from "../API/TParserError";
import {ParseResult} from "../BaseParser/ParseResult";
import {TColumn} from "../Query/Types/TColumn";
import {TString} from "../Query/Types/TString";
import {TNumber} from "../Query/Types/TNumber";
import {TBoolValue} from "../Query/Types/TBoolValue";
import {TDate} from "../Query/Types/TDate";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";
import {columnTypeToString} from "../Table/columnTypeToString";
import {readValue} from "../BlockIO/readValue";
import {columnTypeIsNumeric} from "../Table/columnTypeIsNumeric";
import {numericDisplay} from "../Numeric/numericDisplay";
import {numeric} from "../Numeric/numeric";
import {columnTypeIsInteger} from "../Table/columnTypeIsInteger";
import {columnTypeIsBoolean} from "../Table/columnTypeIsBoolean";
import {columnTypeIsDate} from "../Table/columnTypeIsDate";
import {TableColumnType} from "../Table/TableColumnType";
import {TEPScan} from "./TEPScan";
import {TTable} from "../Query/Types/TTable";
import {cloneContext} from "./cloneContext";
import {readFirst} from "../Cursor/readFirst";
import {runScan} from "./runScan";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {kBooleanResult} from "../API/kBooleanResult";
import {TQueryExpression} from "../Query/Types/TQueryExpression";
import {TValidExpressions} from "../Query/Types/TValidExpressions";
import {evaluate} from "../API/evaluate";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";
import {kQueryExpressionOp} from "../Query/Enums/kQueryExpressionOp";
import {instanceOfTQueryExpression} from "../Query/Guards/instanceOfTQueryExpression";

interface PPP {
    exp: TQueryExpression | TValidExpressions;
    ptr: TQueryExpression | TValidExpressions;
}

// Test constraint CHECK, UNIQUE, FOREIGN KEY
// This may trigger a Table SCAN


function buildConstraintComparison(ret: PPP,
                           foreignTableName: string,
                           foreignColumn: { name: string, ascending: boolean},
                           sourceTable: ITable,
                           sourceTableDef: ITableDefinition,
                           sourceColumn: { name: string, ascending: boolean},
                           sourceRow: DataView,
                           ) {
    let left: TColumn = {
        kind: "TColumn",
        column: foreignColumn.name,
        table: foreignTableName
    }
    let right: TString | TNumber | TBoolValue | TDate | TDateTime | TTime;
    let sourceColumnDef = sourceTableDef.columns.find((c) => { return c.name.toUpperCase() === sourceColumn.name.toUpperCase();});
    let value = readValue(sourceTable, sourceTableDef, sourceColumnDef, sourceRow, rowHeaderSize);
    if (value === undefined) {
        return ret;

    }

    if (columnTypeToString(sourceColumnDef.type)) {
        right = { kind: "TString", value: "'" + value + "'" } as TString
    }
    if (columnTypeIsNumeric(sourceColumnDef.type)) {
        right = { kind: "TNumber", value: numericDisplay(value as numeric)};
    }
    if (columnTypeIsInteger(sourceColumnDef.type)) {
        right = { kind: "TNumber", value: (value as number).toString()};
    }
    if (columnTypeIsBoolean(sourceColumnDef.type)) {
        right = { kind: "TBoolValue", value: (value as boolean)};
    }
    if (columnTypeIsDate(sourceColumnDef.type)) {
        right = value as TDate;
    }
    if (sourceColumnDef.type === TableColumnType.datetime) {
        right = value as TDateTime;
    }
    if (sourceColumnDef.type === TableColumnType.time) {
        right = value as TTime;
    }
    let pred = {
        kind: "TQueryExpression",
        value: {
            left: left,
            right: right,
            op: kQueryExpressionOp.eq
        }
    } as TQueryExpression

    if (ret.exp === undefined) {
        ret.exp = pred;
        ret.ptr = pred;
    } else if (instanceOfTQueryExpression(ret.ptr)) {
        let predBool = {
            kind: "TQueryExpression",
            value: {
                left: ret.exp,
                right: pred,
                op: kQueryExpressionOp.boolAnd
            }

        } as TQueryExpression
        ret.exp = predBool;
        ret.ptr = predBool.value.right;

    }
    return ret;
}


export function checkConstraint(db: SKSQL, context: TExecutionContext, tbl: ITable, def: ITableDefinition, constraint: TTableConstraint, row: DataView, rowLength: number) {
    let currentTable: TTableWalkInfo = {
        table: tbl,
        def: def,
        cursor: undefined,
        name: def.name,
        alias: "",
        rowLength: rowLength
    };
    switch (constraint.type) {
        case kTableConstraintType.check:
            let value = evaluate(db, context, constraint.check, [currentTable], undefined, {forceTable: "", aggregateObjects: [], aggregateMode: "none"},
                {
                    table: tbl,
                    def: def,
                    fullRow: row,
                    offset: rowHeaderSize
                });
            if (!instanceOfTBooleanResult(value) || value.value === kBooleanResult.isFalse) {
                throw new TParserError("Error: Insert statement does not fulfill constraint " + constraint.constraintName + "\nStatement: " +
                    (context.parseResult as ParseResult).start.input);
            }
            break;
        case kTableConstraintType.primaryKey:
        case kTableConstraintType.unique:
        {
            // create a comparison for all columns in the constraint check
            let ptrComp: TQueryExpression = undefined;
            let ret: PPP = { exp: undefined, ptr: undefined};

            for (let i = 0; i < constraint.columns.length; i++) {
                ret = buildConstraintComparison(ret,def.name, constraint.columns[i], tbl, def, constraint.columns[i], row);
                //ret = buildComparison(ret, constraint.columns[i], tbl, def, row, rowLength);
            }

            let tep: TEPScan = {
                kind: "TEPScan",
                table: { kind: "TTable", table: def.name, schema: "dbo" } as TTable,
                projection: [],
                predicate: ret.exp,
                result: "",
                acceptUnknownPredicateResult: false
            }
            let nc = cloneContext(context, "", false, false);

            runScan(db, nc, tep, [{
                name: def.name,
                def: def,
                table: tbl,
                alias: "",
                cursor: readFirst(tbl, def),
                rowLength: rowLength
            }], (scan: TEPScan, tables: TTableWalkInfo[]) => {
                throw new TParserError("Error: Insert statement does not fulfill constraint " + constraint.constraintName + "\nStatement: " +
                    (context.parseResult as ParseResult).start.input);
                return false;
            });

        }
            break;
        case kTableConstraintType.foreignKey:
        {
            let ptrComp: TQueryExpression = undefined;
            let ret: PPP = { exp: undefined, ptr: undefined};

            let foreignTableName = constraint.foreignKeyTable;
            let foreignTable: ITable;
            let foreignTableDef: ITableDefinition;

            let foreignTableInfo = db.tableInfo.get(foreignTableName);
            if (foreignTableInfo) {
                foreignTable = foreignTableInfo.pointer;
                foreignTableDef = foreignTableInfo.def;
            } else {
                foreignTable = db.getTable(foreignTableName);
                foreignTableDef = readTableDefinition(foreignTable.data);
            }
            let foreignTableCursor = readFirst(foreignTable, foreignTableDef);
            let foreignTableRowLength = foreignTableCursor.rowLength + rowHeaderSize;

            if (constraint.columns.length !== constraint.foreignKeyColumnsRef.length) {
                throw new TParserError("Foreign Key Constraint " + constraint.constraintName + " should reference the same number of columns");
            }
            for (let i = 0; i < constraint.columns.length; i++) {
                ret = buildConstraintComparison(ret, foreignTableName, { name: constraint.foreignKeyColumnsRef[i], ascending: true}, tbl, def, constraint.columns[i], row);
                //ret = buildComparison(ret, constraint.columns[i], tbl, def, row, rowLength);
            }

            let tep: TEPScan = {
                kind: "TEPScan",
                table: { kind: "TTable", table: foreignTableName, schema: "dbo" } as TTable,
                projection: [],
                predicate: ret.exp,
                result: "",
                acceptUnknownPredicateResult: false
            }
            let nc = cloneContext(context, "", false, false);
            let foundReference = false;
            runScan(db, nc, tep, [{
                name: foreignTableName,
                def: foreignTableDef,
                table: foreignTable,
                alias: "",
                cursor: foreignTableCursor,
                rowLength: foreignTableRowLength
            }], (scan: TEPScan,tables: TTableWalkInfo[]) => {
                foundReference = true;
                return false;
            });
            if (foundReference === false) {
                throw new TParserError("Error: Insert statement does not fulfill constraint " + constraint.constraintName + "\nStatement: " +
                    (context.parseResult as ParseResult).start.input);
            }
        }
        break;
    }
}