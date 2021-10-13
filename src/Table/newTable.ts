import {ITableDefinition} from "./ITableDefinition";
import {ITableData} from "./ITableData";
import {writeTableDefinition} from "./writeTableDefinition";
import {ITable} from "./ITable";
import {readTableDefinition} from "./readTableDefinition";
import {DBData} from "../API/DBInit";

/*
    generate a new table from the table definition specified.

 */
export function newTable(tb: ITableDefinition): ITable {
    let ret: ITable = {
        data: {
            tableDef: undefined,
            blocks: []
        }
    }
    tb.id = DBData.instance.allTables.length + 1;
    writeTableDefinition(ret.data, tb)
    tb = readTableDefinition(ret.data);

    DBData.instance.allTables.push(ret);
    return ret;

}