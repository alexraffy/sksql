import {instanceOfParseResult} from "../BaseParser/Guards/instanceOfParseResult";
import {SQLResult} from "../API/SQLResult";
import {ParseResult} from "../BaseParser/ParseResult";
import {TQueryUpdate} from "../Query/Types/TQueryUpdate";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {openTables} from "../API/openTables";
import {cursorEOF} from "../Cursor/cursorEOF";
import {evaluateWhereClause} from "../API/evaluateWhereClause";
import {evaluate} from "../API/evaluate";
import {getColumnDefinition} from "../API/getColumnDefinition";
import {writeValue} from "../BlockIO/writeValue";
import {readNext} from "../Cursor/readNext";
import {TQueryDelete} from "../Query/Types/TQueryDelete";
import {TableColumnType} from "../Table/TableColumnType";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {instanceOfTQueryDelete} from "../Query/Guards/instanceOfTQueryDelete";
import {ITable} from "../Table/ITable";
import {ITableDefinition} from "../Table/ITableDefinition";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {readFirst} from "../Cursor/readFirst";
import {TLiteral} from "../Query/Types/TLiteral";
import {TTable} from "../Query/Types/TTable";
import {TAlias} from "../Query/Types/TAlias";
import {instanceOfTAlias} from "../Query/Guards/instanceOfTAlias";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {numeric} from "../Numeric/numeric";
import {isNumeric} from "../Numeric/isNumeric";
import {TParserError} from "../API/TParserError";
import {TExecutionContext} from "./TExecutionContext";
import {runScan} from "./runScan";
import {TEPScan} from "./TEPScan";
import {SKSQL} from "../API/SKSQL";


export function processDeleteStatement(db: SKSQL, context: TExecutionContext, statement: TQueryDelete) {

    let tables = openTables(db, statement);
    for (let i = 0; i < tables.length; i++) {
        let exists = context.openTables.find((ot) => { return ot.name.toUpperCase() === tables[i].name.toUpperCase();});
        if (exists === undefined) {
            context.openTables.push(tables[i]);
        }
    }

    let del = statement as TQueryDelete;
    let tbl: ITable;
    let def: ITableDefinition;
    let rowLength = 0;
    for (let i = 0; i < context.openTables.length; i++) {
        let name = getValueForAliasTableOrLiteral(del.tables[0].tableName)
        if (context.openTables[i].name.toUpperCase() === name.table.toUpperCase()) {
            tbl = context.openTables[i].table;
            def = context.openTables[i].def;
            rowLength = context.openTables[i].rowLength;
        }

    }
    context.currentStatement = del;
    if (tbl === undefined) {
        throw new TParserError("Table " + getValueForAliasTableOrLiteral(del.tables[0].tableName).table + " not found.");
    }

    let numberOfRowsModified: number = 0;
    let done = false;
    let tep = {
        kind: "TEPScan",
        table: {
            kind: "TTable",
            table: getValueForAliasTableOrLiteral(del.tables[0].tableName).table,
            schema: ""
        } as TTable,
        result: "",
        predicate: del.where,
        projection: [],
        range: undefined
    } as TEPScan;

    runScan(db, context, tep, (scan, walking) => {
        let cont = true;
        let w = walking.find((w) => { return w.name.toUpperCase() === getValueForAliasTableOrLiteral(tep.table).table.toUpperCase();});
        if (w === undefined) {
            throw new TParserError("Could not find table " + getValueForAliasTableOrLiteral(tep.table).table.toUpperCase());
        }
        let b = tbl.data.blocks[w.cursor.blockIndex];
        let dv = new DataView(b, w.cursor.offset, w.rowLength);
        let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
        flag = flag | kBlockHeaderField.DataRowFlag_BitDeleted;
        dv.setUint8(kBlockHeaderField.DataRowFlag, flag);

        // mark the block as dirty
        let dvBlock = new DataView(b, 0, 25);
        dvBlock.setUint8(kBlockHeaderField.BlockDirty, 1);

        if (del.top !== undefined) {
            let maxCount = evaluate(db, context, del.top, undefined, undefined);
            if (isNumeric(maxCount)) {
                if (maxCount.m <= numberOfRowsModified) {
                    cont = false;
                }
            } else if (typeof maxCount === "number") {
                if (maxCount <= numberOfRowsModified) {
                    cont = false;
                }
            }
        }

        return cont;
    });

    context.broadcastQuery = true;
    context.result.rowsDeleted += numberOfRowsModified;



}