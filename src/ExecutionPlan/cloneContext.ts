import {TExecutionContext} from "./TExecutionContext";


export function cloneContext(context: TExecutionContext, label: string, keepStack: boolean, keepTables: boolean): TExecutionContext {
    let newContext: TExecutionContext = JSON.parse(JSON.stringify(context));
    newContext.label = label;
    if (keepStack === false) {
        newContext.stack = [];
    }
    if (keepStack === false) {
        newContext.openTables = [];
    }
    return newContext;
}