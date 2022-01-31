import {TQueryCreateFunction} from "../Query/Types/TQueryCreateFunction";
import {TableColumnType} from "../Table/TableColumnType";
import {TDate} from "../Query/Types/TDate";
import {TDateTime} from "../Query/Types/TDateTime";
import {TTime} from "../Query/Types/TTime";
import {numeric} from "../Numeric/numeric";
import {TExecutionContext} from "./TExecutionContext";
import {processStatement} from "./processStatement";


export function runFunction(context: TExecutionContext, fn: TQueryCreateFunction) {


    for (let i = 0; i < fn.ops.length; i++) {
        processStatement(context, fn.ops[i]);
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

    return context.returnValue;

}