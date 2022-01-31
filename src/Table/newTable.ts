import {ITableDefinition} from "./ITableDefinition";
import {ITableData} from "./ITableData";
import {writeTableDefinition} from "./writeTableDefinition";
import {ITable} from "./ITable";
import {readTableDefinition} from "./readTableDefinition";
import {SKSQL} from "../API/SKSQL";

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
    tb.id = SKSQL.instance.allTables.length + 1;
    writeTableDefinition(ret.data, tb)
    //tb = readTableDefinition(ret.data);

    SKSQL.instance.allTables.push(ret);
    return ret;

}