
// Result of a SQLStatement.run
// if the statement contains a SELECT, the data can be found in the table resultTableName
// if error is set, then the query could not be parsed successfully
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