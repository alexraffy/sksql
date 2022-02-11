import {ITableDefinition} from "./ITableDefinition";
import {ITableData} from "./ITableData";
import {writeTableDefinition} from "./writeTableDefinition";
import {ITable} from "./ITable";
import {readTableDefinition} from "./readTableDefinition";
import {SKSQL} from "../API/SKSQL";

/*
    generate a new table from the table definition specified.

 */
export function newTable(db: SKSQL, tb: ITableDefinition): ITable {
    let ret: ITable = {
        data: {
            tableDef: undefined,
            blocks: []
        }
    }
    tb.id = db.allTables.length + 1;
    let def = writeTableDefinition(ret.data, tb)

    //tb = readTableDefinition(ret.data);
    db.allTables.push(ret);
    db.tableInfo.add(ret, def);

    return ret;

}