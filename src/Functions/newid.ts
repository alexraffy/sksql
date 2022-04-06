import {TExecutionContext} from "../ExecutionPlan/TExecutionContext";
import {generateV4UUID} from "../API/generateV4UUID";

// SQL function NEWID
//

export function newid(context: TExecutionContext) {
    return generateV4UUID();
}