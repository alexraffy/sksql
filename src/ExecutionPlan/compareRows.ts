import {ITableDefinition} from "../Table/ITableDefinition";
import {SKSQL} from "../API/SKSQL";
import {ITable} from "../Table/ITable";
import {columnTypeIsInteger} from "../Table/columnTypeIsInteger";
import {TParserError} from "../API/TParserError";
import {readValue} from "../BlockIO/readValue";
import {rowHeaderSize} from "../Table/addRow";
import {writeValue} from "../BlockIO/writeValue";
import {compareBytesBetweenDV} from "../BlockIO/compareBytesBetweenDV";
import {compareValues} from "../API/compareValues";


export function compareRows(row1: DataView, table1: ITable, table1Def: ITableDefinition, row2: DataView, table2: ITable, table2Def: ITableDefinition): boolean {
    let currentColIndex = -1;
    for (let i = 0; i < table1Def.columns.length; i++) {
        let colMain = table1Def.columns[i];
        if (colMain.invisible === true) {
            continue;
        }
        currentColIndex++;
        let subColIndex = -1;
        for (let j = 0; j < table2Def.columns.length; j++) {
            let colSub = table2Def.columns[j];
            if (colSub.invisible !== true) {
                subColIndex++;
                if (subColIndex === currentColIndex) {
                    if (!((colMain.type === colSub.type) || (columnTypeIsInteger(colMain.type) && columnTypeIsInteger(colSub.type)))) {
                        throw new TParserError("Column " + colMain.name + " from set A differs from column " + colSub.name + " in set B");
                    }
                    let value1 = readValue(table1, table1Def, colMain, row1, rowHeaderSize);
                    let value2 = readValue(table2, table2Def, colSub, row2, rowHeaderSize);
                    let dif = compareValues(value1, value2);
                    if (dif !== 0) {
                        return false;
                    }

                }
            }
        }
    }
    return true;
}