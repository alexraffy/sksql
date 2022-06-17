import {TExecutionContext} from "./TExecutionContext";


export function addTempTablesToContext(context: TExecutionContext, arr: string[]) {
    for (let i = 0; i < arr.length; i++) {
        if (context.openedTempTables.includes(arr[i]) == false) {
            context.openedTempTables.push(arr[i]);
        }

    }
}