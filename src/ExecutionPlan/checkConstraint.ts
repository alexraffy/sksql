import {TExecutionContext} from "./TExecutionContext";
import {TTableConstraint} from "../Table/TTableConstraint";
import {kTableConstraintType} from "../Table/kTableConstraintType";
import {evaluateWhereClause} from "../API/evaluateWhereClause";
import {rowHeaderSize} from "../Table/addRow";
import {TParserError} from "../API/TParserError";
import {ParseResult} from "../BaseParser/ParseResult";
import {TQueryComparison} from "../Query/Types/TQueryComparison";
import {TQueryComparisonExpression} from "../Query/Types/TQueryComparisonExpression";
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
import {kQueryComparison} from "../Query/Enums/kQueryComparison";
import {TComparison} from "../Query/Types/TComparison";
import {instanceOfTQueryComparison} from "../Query/Guards/instanceOfTQueryComparison";
import {TEPScan} from "./TEPScan";
import {TTable} from "../Query/Types/TTable";
import {cloneContext} from "./cloneContext";
import {readFirst} from "../Cursor/readFirst";
import {runScan} from "./runScan";
import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {evaluate} from "../API/evaluate";
import {SKSQL} from "../API/SKSQL";
import {readTableDefinition} from "../Table/readTableDefinition";

interface PPP {
    exp: TQueryComparisonExpression | TQueryComparison;
    ptr: TQueryComparisonExpression | TQueryComparison;
}

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
        kind: "TQueryComparison",
        left: left,
        right: right,
        comp: {
            kind: "TComparison",
            negative: false,
            value: kQueryComparison.equal
        } as TComparison
    } as TQueryComparison;
    if (ret.exp === undefined) {
        ret.exp = pred;
        ret.ptr = pred;
    } else if (instanceOfTQueryComparison(ret.ptr)) {
        let predBool = {
            a: ret.exp,
            bool: "AND",
            b: pred,
            kind: "TQueryComparisonExpression"
        } as TQueryComparisonExpression
        ret.exp = predBool;
        ret.ptr = predBool.b;

    }
    return ret;
}


export function checkConstraint(db: SKSQL, context: TExecutionContext, tbl: ITable, def: ITableDefinition, constraint: TTableConstraint, row: DataView, rowLength: number) {
    switch (constraint.type) {
        case kTableConstraintType.check:
            let value = evaluateWhereClause(db, context, constraint.check, {forceTable: "", aggregateObjects: [], aggregateMode: "none"},
                {
                    table: tbl,
                    def: def,
                    fullRow: row,
                    offset: rowHeaderSize
                })
            if (value === false) {
                throw new TParserError("Error: Insert statement does not fulfill constraint " + constraint.constraintName + "\nStatement: " +
                    (context.parseResult as ParseResult).start.input);
            }
            break;
        case kTableConstraintType.primaryKey:
        case kTableConstraintType.unique:
        {
            // create a comparison for all columns in the constraint check
            let ptrComp: TQueryComparison | TQueryComparisonExpression = undefined;
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
                result: ""
            }
            let nc = cloneContext(context, "", false, false);
            nc.openTables = [
                {
                    name: def.name,
                    def: def,
                    table: tbl,
                    alias: "",
                    cursor: readFirst(tbl, def),
                    rowLength: rowLength
                }
            ]
            runScan(db, nc, tep, (scan: TEPScan, walking) => {
                throw new TParserError("Error: Insert statement does not fulfill constraint " + constraint.constraintName + "\nStatement: " +
                    (context.parseResult as ParseResult).start.input);
                return false;
            });

        }
            break;
        case kTableConstraintType.foreignKey:
        {
            let ptrComp: TQueryComparison | TQueryComparisonExpression = undefined;
            let ret: PPP = { exp: undefined, ptr: undefined};

            let foreignTableName = constraint.foreignKeyTable;
            let foreignTable = db.getTable(foreignTableName);
            let foreignTableDef = readTableDefinition(foreignTable.data);
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
                result: ""
            }
            let nc = cloneContext(context, "", false, false);
            nc.openTables = [
                {
                    name: foreignTableName,
                    def: foreignTableDef,
                    table: foreignTable,
                    alias: "",
                    cursor: foreignTableCursor,
                    rowLength: foreignTableRowLength
                }
            ]
            let foundReference = false;
            runScan(db, nc, tep, (scan: TEPScan, walking) => {
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