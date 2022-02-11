

export interface SQLResult {
    error?: string;
    messages?: string;

    rowCount: number;
    rowsInserted: number;
    rowsModified: number;
    rowsDeleted: number;
    resultTableName: string;

    dropTable?: string[];

    queries: {
        statement: string;
        parserTime: number;
        runtime: number;
        executionPlan: {
            description: string
        }
    }[];

    parserTime: number;
    totalRuntime: number;

    returnValue?: any;


}