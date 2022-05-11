import {ITableDefinition} from "../Table/ITableDefinition";
import {ITable} from "../Table/ITable";
import {addRow, rowHeaderSize} from "../Table/addRow";
import {columnTypeIsInteger} from "../Table/columnTypeIsInteger";
import {TParserError} from "../API/TParserError";
import {readValue} from "./readValue";
import {writeValue} from "./writeValue";


export function copyRow(srcRow: DataView, table1: ITable, table1Def: ITableDefinition, table2: ITable, table2Def: ITableDefinition, lenNewBuffer) {

    let newRow = addRow(table2.data, lenNewBuffer);
    let currentColIndex = -1;
    for (let i = 0; i < table2Def.columns.length; i++) {
        let colMain = table2Def.columns[i];
        if (colMain.invisible === true) {
            continue;
        }
        currentColIndex++;
        let subColIndex = -1;
        for (let j = 0; j < table1Def.columns.length; j++) {
            let colSub = table1Def.columns[j];
            if (colSub.invisible !== true) {
                subColIndex++;
                if (subColIndex === currentColIndex) {
                    if (!((colMain.type === colSub.type) || (columnTypeIsInteger(colMain.type) && columnTypeIsInteger(colSub.type)))) {
                        throw new TParserError("Incompatible type between columns. Column " + colMain.name + " from set A differs from column " + colSub.name + " in set B");
                    }
                    let value = readValue(table1, table1Def, colSub, srcRow, rowHeaderSize);
                    writeValue(table2, table2Def, colMain, newRow, value, rowHeaderSize);
                }
            }
        }
    }
}