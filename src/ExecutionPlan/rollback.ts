import {TExecutionContext} from "./TExecutionContext";
import {SKSQL} from "../API/SKSQL";


export function rollback(db: SKSQL, context: TExecutionContext, message: string) {
    context.rollback = true;
    context.rollbackMessage = message;
}