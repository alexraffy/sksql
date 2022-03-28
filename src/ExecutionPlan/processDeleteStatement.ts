
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {evaluate} from "../API/evaluate";
import {TQueryDelete} from "../Query/Types/TQueryDelete";
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
import {openTable} from "../API/openTables";
import {recordSize} from "../Table/recordSize";
import {findWalkTable} from "./findWalkTable";
import {contextTables} from "./contextTables";


export function processDeleteStatement(db: SKSQL, context: TExecutionContext, statement: TQueryDelete) {

    let del = statement as TQueryDelete;
    let tbl: ITable;
    let def: ITableDefinition;
    let rowLength = 0;
    let tblInfo = db.tableInfo.get(getValueForAliasTableOrLiteral(statement.tables[0].tableName as TAlias | TTable).table);
    tbl = tblInfo.pointer;
    def = tblInfo.def;
    rowLength = recordSize(tbl.data);

    context.currentStatement = del;
    if (tbl === undefined) {
        throw new TParserError("Table " + getValueForAliasTableOrLiteral(del.tables[0].tableName as (TAlias | TTable)).table + " not found.");
    }
    contextTables(db, context, del, undefined, del);
    let numberOfRowsModified: number = 0;
    let done = false;
    let tep = {
        kind: "TEPScan",
        table: {
            kind: "TTable",
            table: getValueForAliasTableOrLiteral(del.tables[0].tableName as (TAlias | TTable)).table.toUpperCase(),
            schema: ""
        } as TTable,
        result: "",
        predicate: del.where,
        projection: [],
        range: undefined
    } as TEPScan;

    runScan(db, context, tep, [{
        name: def.name.toUpperCase(),
        def: def,
        table: tbl,
        alias: "",
        cursor: readFirst(tbl, def),
        rowLength: rowLength
    }], (scan: TEPScan, tables: TTableWalkInfo[]) => {
        let cont = true;
        let w = findWalkTable(tables, tep.table);

        let b = tbl.data.blocks[w.cursor.blockIndex];
        let dv = new DataView(b, w.cursor.offset, w.rowLength);
        let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
        flag = flag | kBlockHeaderField.DataRowFlag_BitDeleted;
        dv.setUint8(kBlockHeaderField.DataRowFlag, flag);

        // mark the block as dirty
        let dvBlock = new DataView(b, 0, 25);
        dvBlock.setUint8(kBlockHeaderField.BlockDirty, 1);

        if (del.top !== undefined) {
            let maxCount = evaluate(db, context, del.top, [], undefined, undefined);
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