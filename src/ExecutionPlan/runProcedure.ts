import {numeric} from "../Numeric/numeric";
import {TDateTime} from "../Query/Types/TDateTime";
import {TDate} from "../Query/Types/TDate";
import {TTime} from "../Query/Types/TTime";
import {TQueryCreateProcedure} from "../Query/Types/TQueryCreateProcedure";
import {TExecute} from "../Query/Types/TExecute";
import {processStatement} from "./processStatement";
import {TExecutionContext} from "./TExecutionContext";
import {cloneContext} from "./cloneContext";
import {swapContext} from "./swapContext";
import {SKSQL} from "../API/SKSQL";
import {SQLStatement} from "../API/SQLStatement";
import {kResultType} from "../API/kResultType";
import {readFirst} from "../Cursor/readFirst";
import {runScan} from "./runScan";
import {cursorEOF} from "../Cursor/cursorEOF";
import {rowHeaderSize} from "../Table/addRow";
import {kBlockHeaderField} from "../Blocks/kBlockHeaderField";
import {readNext} from "../Cursor/readNext";
import {readValue} from "../BlockIO/readValue";
import {TableColumn} from "../Table/TableColumn";

// run all operations in a stored proc

export function runProcedure(db: SKSQL, context: TExecutionContext, st: TExecute,
                             proc: TQueryCreateProcedure
                             ) {
    let ret: string | numeric | number | boolean | bigint | TDateTime | TDate | TTime = undefined;

    let newContext = cloneContext(context, proc.procName, true, true);
    newContext.query = context.query;
    if (newContext.query === "") {
        let routines = db.tableInfo.get("routines");
        let colProcName: TableColumn;
        let colDefinition: TableColumn;
        for (let i = 0; i < routines.def.columns.length; i++) {
            let nameUp = routines.def.columns[i].name.toUpperCase();
            if (nameUp === "NAME") {
                colProcName = routines.def.columns[i];
            }
            if (nameUp === "DEFINITION") {
                colDefinition = routines.def.columns[i];
            }
        }

        let cursor = readFirst(routines.pointer, routines.def);
        while (!cursorEOF(cursor)) {
            let dv = new DataView(routines.pointer.data.blocks[cursor.blockIndex], cursor.offset, cursor.rowLength + rowHeaderSize);
            let flag = dv.getUint8(kBlockHeaderField.DataRowFlag);
            const isDeleted = ((flag & kBlockHeaderField.DataRowFlag_BitDeleted) === kBlockHeaderField.DataRowFlag_BitDeleted) ? 1 : 0;
            if (isDeleted) {
                cursor = readNext(routines.pointer, routines.def, cursor);
                continue;
            }
            let procName = readValue(routines.pointer, routines.def, colProcName, dv, rowHeaderSize) as string;
            if (procName.toUpperCase() === proc.procName.toUpperCase()) {
                newContext.query = readValue(routines.pointer, routines.def, colDefinition, dv, rowHeaderSize) as string;
                break;
            }
            cursor = readNext(routines.pointer, routines.def, cursor);
        }

    }

    for (let i = 0; i < proc.ops.length; i++) {
        newContext.currentStatement = proc.ops[i];
        processStatement(db, newContext, proc.ops[i]);
        //@ts-ignore
        if (newContext.exitExecution === true) {
            break;
        }
        //@ts-ignore
        if (newContext.breakLoop === true) {
            //exitCurrentLoop = false;
            break;
        }
    }
    swapContext(context, newContext);
    context.stack = newContext.stack;
    context.exitExecution = false;
    context.breakLoop = false;
    context.scopedIdentity = newContext.scopedIdentity;
    context.broadcastQuery = newContext.broadcastQuery;



}