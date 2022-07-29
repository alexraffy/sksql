import {ITableDefinition} from "./ITableDefinition";
import {writeTableDefinition} from "./writeTableDefinition";
import {ITable} from "./ITable";
import {SKSQL} from "../API/SKSQL";
import {kModifiedBlockType, TExecutionContext} from "../ExecutionPlan/TExecutionContext";

/*
    generate a new table from the table definition specified.

 */
export function newTable(db: SKSQL, tb: ITableDefinition, context: TExecutionContext = undefined): ITable {
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

    if (context !== undefined) {
        context.modifiedBlocks.push({
            name: tb.name,
            type: kModifiedBlockType.tableHeader,
            blockIndex: -1
        });
    }

    return ret;

}