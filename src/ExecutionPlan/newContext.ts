import {TExecutionContext} from "./TExecutionContext";
import {ParseResult} from "../BaseParser/ParseResult";


export function createNewContext(label: string, query: string, parseResult: ParseResult): TExecutionContext {
    return {
        label: label,
        openTables: [],
        scopedIdentity: undefined,
        breakLoop: false,
        exitExecution: false,
        parseResult: parseResult,
        results: [],
        query: query,
        rollback: false,
        rollbackMessage: "",
        broadcastQuery: false,
        openedTempTables: [],
        stack: [],
        returnValue: undefined,
        transactionId: 0
    }
}