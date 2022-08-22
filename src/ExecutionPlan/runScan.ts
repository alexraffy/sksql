import {TEPScan} from "./TEPScan";
import {getValueForAliasTableOrLiteral} from "../Query/getValueForAliasTableOrLiteral";
import {TTableWalkInfo} from "../API/TTableWalkInfo";
import {kDebugLevel, SKSQL} from "../API/SKSQL";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {offs} from "../Blocks/kBlockHeaderField";
import {TExecutionContext} from "./TExecutionContext";
import {findWalkTable} from "./findWalkTable";
import {kBooleanResult} from "../API/kBooleanResult";
import {evaluate} from "../API/evaluate";
import {TBooleanResult} from "../API/TBooleanResult";
import {instanceOfTBooleanResult} from "../Query/Guards/instanceOfTBooleanResult";
import {TParserError} from "../API/TParserError";
import {dumpAllColumnsInCurrentRow} from "../Table/dumpAllColumnsInCurrentRow";
import {dumpContextInfo} from "./dumpContextInfo";

// SCAN a table
// this goes through all records in a table.
// if a predicate is present, we evaluate it
// finally if the record is wanted, we call back onRowSelected

export interface TScanResult {
    rowsScannedTotal: number;
    rowsScanned: number;
    rowsSelected: number;
}

export function runScan(db: SKSQL, context: TExecutionContext,
                        tep: TEPScan,
                        tables: TTableWalkInfo[],
                        onRowSelected: (scan: TEPScan, tables: TTableWalkInfo[]) => boolean): TScanResult  {
    let retInfo: TScanResult = {
        rowsScannedTotal: 0,
        rowsScanned: 0,
        rowsSelected: 0
    }




    let tableName = getValueForAliasTableOrLiteral(tep.table);


    if (db.debugLevel >= kDebugLevel.L8_scans) {
        console.log("RunScan: '" + tableName.alias + "' (" + tableName.table + ")" );
        let strTables = "";
        for (let i = 0; i < tables.length; i++) {
            strTables += tables[i].name;
            if (tables[i].alias !== undefined && tables[i].alias !== "") {
                strTables += " AS " + tables[i].alias;
            }
            strTables += (i === tables.length - 1) ? "" : ", ";
        }
        console.log("Open Tables: " + strTables);
        if (db.debugLevel >= kDebugLevel.L990_contextUpdate) {
            console.log(dumpContextInfo(context, "runScan"));
        }
    }

    let walk = findWalkTable(tables, tep.table);
    if (walk === undefined) {
        throw new TParserError("runScan called for " + tableName + ". Table was not found in the current context." );
    }
    walk.cursor = readFirst(walk.table, walk.def);
    while (!cursorEOF(walk.cursor)) {
        //console.log(tblDef.name + " blk: " + walk.cursor.blockIndex + ":" + walk.cursor.offset);
        let b = walk.table.data.blocks[walk.cursor.blockIndex];
        let dv = new DataView(b, walk.cursor.offset, walk.rowLength);
        let flag = dv.getUint8(offs().DataRowFlag);
        const isDeleted = ((flag & offs().DataRowFlag_BitDeleted) === offs().DataRowFlag_BitDeleted) ? 1 : 0;
        if (isDeleted) {
            retInfo.rowsScannedTotal += 1;
            walk.cursor = readNext(walk.table, walk.def, walk.cursor);
            continue;
        }
        retInfo.rowsScanned += 1;
        if (db.debugLevel >= kDebugLevel.L900_eachRow) {
            console.log(dumpAllColumnsInCurrentRow(dv, walk.table, walk.def, walk.rowLength));
        }
        let selectRow: TBooleanResult = {kind: "TBooleanResult", value: kBooleanResult.isTrue};
        if (tep.predicate !== undefined) {
            selectRow = evaluate(db, context, tep.predicate, tables, undefined, {currentStep: tep, aggregateObjects: [], aggregateMode: "none"}) as TBooleanResult;
        }
        if (db.debugLevel >= kDebugLevel.L910_scanPredicate) {
            switch (selectRow.value) {
                case kBooleanResult.isUnknown:
                    console.log("row predicate: UNKNOWN");
                    break;
                case kBooleanResult.isFalse:
                    console.log("row predicate: FALSE");
                    break;
                case kBooleanResult.isTrue:
                    console.log("row predicate: TRUE");
                    break;
            }
        }
        if (instanceOfTBooleanResult(selectRow) && selectRow.value === kBooleanResult.isTrue || ((typeof selectRow === "boolean") && selectRow === true) ||
            (instanceOfTBooleanResult(selectRow) && selectRow.value === kBooleanResult.isUnknown && tep.acceptUnknownPredicateResult === true)) {
            retInfo.rowsSelected += 1;
            let ret = onRowSelected(tep, [walk, ...tables]);
            if (ret === false){
                break;
            }
        }
        walk.cursor = readNext(walk.table, walk.def, walk.cursor);
    }
    walk.cursor = {offset: -1, tableIndex: -1, blockIndex: -1, rowLength: walk.rowLength};

    return retInfo;
}