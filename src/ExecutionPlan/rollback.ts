import {TExecutionContext} from "./TExecutionContext";


export function rollback(context: TExecutionContext, message: string) {
    context.rollback = true;
    context.rollbackMessage = message;
}