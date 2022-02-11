import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {generateV4UUID} from "../API/generateV4UUID";


export function newid(context: TExecutionContext) {
    return generateV4UUID();
}