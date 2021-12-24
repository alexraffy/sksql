import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {readFirst} from "../Cursor/readFirst";
import {cursorEOF} from "../Cursor/cursorEOF";
import {readNext} from "../Cursor/readNext";
import {TQueryOrderBy} from "../Query/Types/TQueryOrderBy";
import {readValue} from "../BlockIO/readValue";
import {instanceOfTColumn} from "../Query/Guards/instanceOfTColumn";
import {instanceOfTLiteral} from "../Query/Guards/instanceOfTLiteral";
import {TableColumnType} from "../Table/TableColumnType";
import {kOrder} from "../Query/Enums/kOrder";
import {copyBytesBetweenDV} from "../BlockIO/copyBytesBetweenDV";
import {TDateCmp} from "../Date/TDateCmp";
import {TDate} from "../Query/Types/TDate";
import { numericCmp } from "../Numeric/numericCmp";
import { numeric } from "../Numeric/numeric";

/*
    sort the table rows in place
 */
export function bubbleSort(table: ITable, def: ITableDefinition, orderBys: TQueryOrderBy[]) {
    let done_sorting = true;
    for (let i = 0; i < orderBys.length; i++) {
        let o = orderBys[i];
        let colName = "";
        if (instanceOfTColumn(o.column)) {
            colName = o.column.column.toUpperCase();
        } else if (instanceOfTLiteral(o.column)) {
            colName = o.column.value.toUpperCase();
        } else {
            throw "Could not find column in order by clause";
        }
        if (colName === "ROWID") {
            return;
        }

        let colDef = def.columns.find((c) => { return c.name.toUpperCase() === colName; })
        if (colDef === undefined) {
            throw "Could not find column " + colName;
        }
        do {
            let idx = 0;
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
                    let col1 = readValue(table, def, colDef, row1, 5);
                    let col2 = readValue(table, def, colDef, row2, 5);
                    let compareValue = 0;
                    switch (colDef.type) {
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
                        default:
                        {

                        }
                        break;
                    }
                    if (compareValue === 1) {

                        let swap = new ArrayBuffer(cursor.rowLength + 5);
                        let dvSwap = new DataView(swap);
                        copyBytesBetweenDV(cursor.rowLength, row1, dvSwap, 5, 5);
                        copyBytesBetweenDV(cursor.rowLength, row2, row1, 5, 5);
                        copyBytesBetweenDV(cursor.rowLength, dvSwap, row2, 5, 5);
                        done_sorting = false;

                    }

                }

            }

        } while (done_sorting === false);
    }

}