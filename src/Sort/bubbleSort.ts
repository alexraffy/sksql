import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {TQueryOrderBy} from "../Query/Types/TQueryOrderBy";
import {TableColumnType} from "../Table/TableColumnType";
import {kOrder} from "../Query/Enums/kOrder";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {TDateCmp} from "../Date/TDateCmp";
import {TDate} from "../Query/Types/TDate";
import {numericCmp} from "../Numeric/numericCmp";
import {numeric} from "../Numeric/numeric";
import {TableColumn} from "../Table/TableColumn";
import {recordSize} from "../Table/recordSize";
import {TTimeCmp} from "../Date/TTimeCmp";
import {TTime} from "../Query/Types/TTime";
import {TDateTimeCmp} from "../Date/TDateTimeCmp";
import {TDateTime} from "../Query/Types/TDateTime";
import {SKSQL} from "../API/SKSQL";
import {evaluate} from "../API/evaluate";
import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {isNumeric} from "../Numeric/isNumeric";
import {instanceOfTTime} from "../Query/Guards/instanceOfTTime";
import {instanceOfTDate} from "../Query/Guards/instanceOfTDate";
import {instanceOfTDateTime} from "../Query/Guards/instanceOfTDateTime";
import {compareValues} from "../API/compareValues";
import {readFirstColumnOfTable} from "../API/readFirstColumnOfTable";
import {instanceOfTTable} from "../Query/Guards/instanceOfTTable";


function compareRows(db: SKSQL, context: TExecutionContext, table: ITable, def: ITableDefinition, row1: DataView, row2: DataView, orderBys: TQueryOrderBy[], colsDefs: TableColumn[]): number {
    let idx = -1;
    let compareValue = 0;
    if (row2 as any === 0) { return 0;}
    while (compareValue === 0 && idx < orderBys.length - 1) {
        idx++;
        //let colDef = colsDefs[idx];
        let o = orderBys[idx];
        //let col1 = readValue(table, def, colDef, row1, 5);
        //let col2 = readValue(table, def, colDef, row2, 5);

        let col1 = evaluate(db, context, o.column, context.tables, undefined, {aggregateMode: "none", forceTable: "", aggregateObjects: []}, {
            fullRow: row1,
            table: table,
            def: def,
            offset: 5
        });
        if (instanceOfTTable(col1)) {
            col1 = readFirstColumnOfTable(db, context, col1);
        }
        let col2 = evaluate(db, context, o.column, context.tables, undefined, {aggregateMode: "none", forceTable: "", aggregateObjects: []}, {
            fullRow: row2,
            table: table,
            def: def,
            offset: 5
        });
        if (instanceOfTTable(col2)) {
            col2 = readFirstColumnOfTable(db, context, col2);
        }

        if (col1 === undefined && o.order === kOrder.asc) {
            return -1;
        } else if (col1 === undefined && o.order === kOrder.desc) {
            return 1;
        } else if (col2 === undefined && o.order === kOrder.asc) {
            return 1;
        } else if (col2 === undefined && o.order === kOrder.desc) {
            return -1;
        }

        let compareValue = compareValues(col1, col2);
        if (o.order === kOrder.desc) {
            compareValue = -compareValue;
        }
        return compareValue as number;

        let type = TableColumnType.int32;
        if (typeof col1 === "string") {
            type = TableColumnType.varchar;
        } else if (typeof col1 === "boolean") {
            type = TableColumnType.boolean;
        } else if (typeof col1 === "number") {
            type = TableColumnType.int32;
        } else {
            if (isNumeric(col1)) {
                type = TableColumnType.numeric;
            } else if (instanceOfTDateTime(col1)) {
                type = TableColumnType.datetime;
            } else if (instanceOfTDate(col1)) {
                type = TableColumnType.date;
            } else if (instanceOfTTime(col1)) {
                type = TableColumnType.time;
            }
        }
        compareValue = 0;
        switch (type) {
            case TableColumnType.blob:
                break;
            case TableColumnType.date:
            {
                compareValue = TDateCmp(col1 as TDate, col2 as TDate);
                if (o.order === kOrder.desc) {
                    compareValue = -compareValue;
                }
            }
                break;
            case TableColumnType.time:
            {
                compareValue = TTimeCmp(col1 as TTime, col2 as TTime);
                if (o.order === kOrder.desc) {
                    compareValue = -compareValue;
                }
            }
                break;
            case TableColumnType.datetime:
            {
                compareValue = TDateTimeCmp(col1 as TDateTime, col2 as TDateTime);
                if (o.order === kOrder.desc) {
                    compareValue = -compareValue;
                }
            }
                break;
            case TableColumnType.numeric:
            {
                compareValue = numericCmp(col1 as numeric, col2 as numeric);
                if (o.order === kOrder.desc) {
                    compareValue = -compareValue;
                }
            }
                break;
            case TableColumnType.varchar:
            {
                let c = (col1 as string).localeCompare((col2 as string));
                if (c === 0) {
                    compareValue = 0;
                } else if (c == 1) {
                    compareValue = 1;
                    if (o.order === kOrder.desc) {
                        compareValue = -1;
                    }
                } else if (c === -1) {
                    compareValue = -1;
                    if (o.order === kOrder.desc) {
                        compareValue = 1;
                    }
                }

            }
                break;
            case TableColumnType.boolean:
            {
                if (col1 as boolean === true && col2 as boolean == false) {
                    compareValue = -1;
                }  else if (col1 as boolean === false && col2 as boolean === true) {
                    compareValue = 1
                } else {
                    compareValue = 0;
                }
                if (o.order === kOrder.desc) {
                    compareValue = -compareValue;
                }
            }
                break;
            case TableColumnType.float:
            {

            }
                break;
            case TableColumnType.int:
            case TableColumnType.int8:
            case TableColumnType.int16:
            case TableColumnType.int32:
            case TableColumnType.int64:
            case TableColumnType.uint8:
            case TableColumnType.uint16:
            case TableColumnType.uint32:
            case TableColumnType.uint64:
            case TableColumnType.float:
            case TableColumnType.double:
            {
                if (col1 < col2) {
                    compareValue = -1;
                } else if (col1 > col2) {
                    compareValue = 1;
                } else {
                    compareValue = 0;
                }
                if (o.order === kOrder.desc) {
                    compareValue = -compareValue;
                }
            }
                break;

            default:
            {

            }
                break;
        }
    }
    return compareValue;
}


/*
    sort the table rows in place
 */
export function bubbleSort(db: SKSQL, context: TExecutionContext, table: ITable, def: ITableDefinition, orderBys: TQueryOrderBy[]) {
    // allocate a buffer to swap rows
    let len = recordSize(table.data) + 5;
    let swap = new ArrayBuffer(len);
    let dvSwap = new DataView(swap);
    // find columns definitions

    let colsDefs: TableColumn[] = [];
    /*
    for (let i = 0; i < orderBys.length; i++) {
        let o = orderBys[i];
        let colName = (o.column.alias.alias as string).toUpperCase();

        let colDef = def.columns.find((c) => {
            let cn = c.name.toUpperCase();
            return cn === colName;
        });
        if (colDef === undefined) {
            console.log("ERROR");
            console.log(dumpTable(table));
            throw new TParserError("Could not find column " + colName);
        }
        colsDefs.push(colDef);
    }
     */
    // scan the table until there is no rows out of order
    let done_sorting = true;
    do {
        done_sorting = true;
        let cursor = readFirst(table, def);
        while (!cursorEOF(cursor)) {
            let block1 = cursor.blockIndex;
            let offset1 = cursor.offset;
            let row1 = new DataView(table.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + 5);
            let block2 = 0;
            let offset2 = 0;
            let row2;
            cursor = readNext(table, def, cursor);
            if (!cursorEOF(cursor)) {
                block2 = cursor.blockIndex;
                offset2 = cursor.offset;
                row2 = new DataView(table.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + 5);
                if (compareRows(db, context, table, def, row1, row2, orderBys, colsDefs) === 1) {
                    copyBytesBetweenDV(cursor.rowLength, row1, dvSwap, 5, 5);
                    copyBytesBetweenDV(cursor.rowLength, row2, row1, 5, 5);
                    copyBytesBetweenDV(cursor.rowLength, dvSwap, row2, 5, 5);
                    done_sorting = false;
                }
            }
        }
    } while (done_sorting === false);

}

