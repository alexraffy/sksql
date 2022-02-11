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
        result: {
            resultTableName: "",
            rowCount: 0,
            rowsModified: 0,
            rowsInserted: 0,
            rowsDeleted: 0,
            parserTime: 0,
            totalRuntime: 0,
            messages: "",
            queries: []
        },
        query: query,
        rollback: false,
        rollbackMessage: "",
        broadcastQuery: false,
        openedTempTables: [],
        stack: [],
        returnValue: undefined,
        transactionId: 0,
        currentStatement: undefined
    }
}