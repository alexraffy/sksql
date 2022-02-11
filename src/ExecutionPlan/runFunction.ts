import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {TableColumnType} from "../Table/TableColumnType";
import {TDate} from "../Query/Types/TDate";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";
import {numeric} from "../Numeric/numeric";
import {TExecutionContext} from "./TExecutionContext";
import {processStatement} from "./processStatement";
import {SKSQL} from "../API/SKSQL";


export function runFunction(db: SKSQL, context: TExecutionContext, fn: TQueryCreateFunction) {


    for (let i = 0; i < fn.ops.length; i++) {
        processStatement(db, context, fn.ops[i]);
        //@ts-ignore
        if (context.exitExecution === true) {
            return context.returnValue;
        }
        //@ts-ignore
        if (context.breakLoop === true) {
            //exitCurrentLoop = false;
            break;
        }
    }
    context.result.returnValue = context.returnValue;
    context.exitExecution = false;
    context.breakLoop = false;
    return context.returnValue;

}